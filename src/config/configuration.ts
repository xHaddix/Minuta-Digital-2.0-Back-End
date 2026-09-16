import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'super-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  database: {
    centralUrl: process.env.CENTRAL_DATABASE_URL,
    tenantBaseUrl: process.env.TENANT_DATABASE_BASE_URL,
  },
  storage: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.S3_REGION ?? 'us-east-1',
    bucket: process.env.S3_BUCKET ?? 'minuta-bucket',
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
  },
  mail: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
    secure: (process.env.SMTP_SECURE ?? 'false') === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'Minuta Digital <no-reply@minutadigital.local>',
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  },
}));
