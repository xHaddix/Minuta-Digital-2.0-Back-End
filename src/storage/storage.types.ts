export type StorageModuleKey =
  | 'correspondence'
  | 'pqrs'
  | 'parking'
  | 'marketplace'
  | 'residents'
  | 'general';

export interface UploadFileParams {
  /** ID o slug del tenant, usado como primer segmento de la ruta en el bucket. */
  tenantId: string;
  /** Módulo/dominio de negocio al que pertenece el archivo. */
  module: StorageModuleKey;
  /** Nombre de archivo original (se le antepone un UUID para evitar colisiones). */
  fileName: string;
  /** Buffer del archivo a subir. */
  body: Buffer;
  /** Tipo de contenido MIME (ej: image/png). */
  contentType?: string;
}

export interface UploadFileResult {
  /** Key completa dentro del bucket, ej: {tenantId}/{module}/{uuid}-{fileName} */
  key: string;
  /** URL pública/servible del archivo (según configuración del bucket). */
  url: string;
  bucket: string;
}
