# Minuta Digital – Backend SaaS Multi-Tenant

Backend en **NestJS + TypeScript + Prisma 7 + PostgreSQL 18** para la plataforma
residencial "Minuta Digital" (minuta virtual, correspondencia, PQRS, reservas
de amenidades, control de visitantes y mercado interno).

## Arquitectura

El sistema utiliza una única base de datos PostgreSQL, con todas las tablas en
el esquema `public`. La separación entre organizaciones y conjuntos
residenciales es lógica y se aplica mediante `organizationId` y
`residentialComplexId` en el modelo central. No se crean bases ni esquemas
PostgreSQL separados por tenant.

Los archivos en S3/MinIO y las rooms de Socket.IO mantienen aislamiento lógico
por conjunto residencial mediante sus identificadores.

## Estructura de carpetas

```
prisma/
  central/schema.prisma   # Todos los modelos de la base central
  seed.ts
src/
  auth/                   # AuthService, JwtStrategy, guards
  common/                 # decorators, interfaces (JwtPayload), guards compartidos
  config/                 # ConfigModule (configuration.ts)
  prisma/                 # PrismaService con Driver Adapter de PostgreSQL
  storage/                # StorageService (S3/MinIO) con aislamiento por tenant
  notifications/          # WebSocket Gateway (Socket.IO) por rooms de tenant
  webhooks/               # WebhooksController (pagos, WhatsApp)
  users/ residents/ visitors/ correspondence/ amenities/ pqrs/ marketplace/
```

## Levantar el entorno de desarrollo

```bash
cp .env.example .env
docker compose up -d
```

Esto levanta:

- `postgres` → PostgreSQL 18 en `localhost:5432`
- `minio` → API S3 en `localhost:9000`, consola en `localhost:9001`
- `minio-init` → crea automáticamente el bucket `minuta-bucket`
- `api` → NestJS con hot-reload en `localhost:3000` (Swagger en `/api/docs`)
- `prisma-studio` → inspección de la base central en `localhost:5555`

## Migraciones

```bash
# Base central
npm run prisma:migrate
```

## Seed de datos de ejemplo

```bash
npm run prisma:seed
```

Crea una organización, un conjunto residencial y el usuario
`admin@demo.minutadigital.com` / `Admin123!`.

## Autenticación

```
POST /api/v1/auth/login
{
  "email": "admin@demo.minutadigital.com",
  "password": "Admin123!",
  "tenantSlug": "demo"
}
```

El `accessToken` devuelto debe enviarse como `Authorization: Bearer <token>`
en el resto de endpoints.
