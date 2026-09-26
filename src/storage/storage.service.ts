import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { UploadFileParams, UploadFileResult } from './storage.types';

/**
 * StorageService
 * ----------------------------------------------------------------------------
 * Abstracción sobre AWS S3 / MinIO para gestión de archivos (evidencias de minuta,
 * paquetería, fotos de parqueaderos, adjuntos de PQRS, imágenes de marketplace, etc.).
 *
 * AISLAMIENTO MULTI-TENANT POR CONJUNTO RESIDENCIAL:
 * Cada objeto se persiste bajo la ruta/key aislada:
 *   {residentialComplexId}/{module}/{uuid}-{fileName}
 *
 * El discriminador `residentialComplexId` proviene estrictamente del JWT/req.user,
 * impidiendo que un conjunto residencial acceda o sobrescriba archivos de otro.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('app.storage.bucket', 'minuta-bucket');

    this.client = new S3Client({
      region: this.configService.get<string>('app.storage.region', 'us-east-1'),
      endpoint: this.configService.get<string>('app.storage.endpoint'),
      forcePathStyle: this.configService.get<boolean>('app.storage.forcePathStyle', true),
      // Supabase Storage no admite x-amz-sdk-checksum-algorithm en el endpoint S3.
      // Evita el CRC32 automático que AWS SDK v3.729+ agrega por defecto a PutObject.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials: {
        accessKeyId: this.configService.get<string>('app.storage.accessKeyId', ''),
        secretAccessKey: this.configService.get<string>('app.storage.secretAccessKey', ''),
      },
    });
  }

  /**
   * Construye la key aislada por conjunto residencial:
   * {residentialComplexId}/{module}/{uuid}-{fileName}
   */
  private buildKey(residentialComplexId: string, moduleName: string, fileName: string): string {
    const sanitizedFileName = fileName.replace(/\s+/g, '-').toLowerCase();
    return `${residentialComplexId}/${moduleName}/${uuidv4()}-${sanitizedFileName}`;
  }

  async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    // params.tenantId contiene en realidad el residentialComplexId validado por el controlador
    const key = this.buildKey(params.tenantId, params.module, params.fileName);

    return this.uploadObject(key, params.body, params.contentType);
  }

  async uploadOrganizationLogo(organizationId: string, body: Buffer, contentType: string) {
    return this.uploadObject(
      `orgs/${organizationId}/logo/${uuidv4()}.${this.extension(contentType)}`,
      body,
      contentType,
    );
  }

  async uploadComplexLogo(complexId: string, body: Buffer, contentType: string) {
    return this.uploadObject(
      `complexes/${complexId}/logo/${uuidv4()}.${this.extension(contentType)}`,
      body,
      contentType,
    );
  }

  async uploadUserAvatar(complexId: string, userId: string, body: Buffer, contentType: string) {
    return this.uploadObject(
      `complexes/${complexId}/users/${userId}/${uuidv4()}.${this.extension(contentType)}`,
      body,
      contentType,
    );
  }

  async uploadPublicFavicon(body: Buffer, contentType = 'image/x-icon') {
    return this.uploadObject(`public/favicons/${uuidv4()}.ico`, body, contentType);
  }

  private extension(contentType: string): string {
    const extensions: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
    };
    return extensions[contentType] ?? 'bin';
  }

  private async uploadObject(key: string, body: Buffer, contentType?: string) {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    } catch (error) {
      this.logger.error(`Error subiendo archivo a S3/MinIO: ${key}`, error as Error);
      throw new InternalServerErrorException('No fue posible subir el archivo');
    }

    return {
      key,
      bucket: this.bucket,
      url: this.buildPublicUrl(key),
    };
  }

  /**
   * Genera una URL firmada temporal (válida por `expiresInSeconds`) para
   * descargar un archivo privado directamente desde el cliente S3/MinIO.
   */
  async getSignedDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
    try {
      return await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: expiresInSeconds },
      );
    } catch (error) {
      this.logger.error(`Error generando URL firmada para: ${key}`, error as Error);
      throw new InternalServerErrorException('No fue posible generar la URL de descarga');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      this.logger.error(`Error eliminando archivo: ${key}`, error as Error);
      throw new InternalServerErrorException('No fue posible eliminar el archivo');
    }
  }

  /**
   * Construye la URL pública del objeto almacenado.
   */
  private buildPublicUrl(key: string): string {
    const publicUrl = this.configService.get<string>('app.storage.publicUrl', '');
    if (publicUrl)
      return `${publicUrl.replace(/\/$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
    const endpoint = this.configService.get<string>('app.storage.endpoint', '');
    return `${endpoint.replace(/\/$/, '')}/${this.bucket}/${key}`;
  }
}
