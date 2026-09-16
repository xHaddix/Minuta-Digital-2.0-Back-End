# Minuta Digital – Backend SaaS Multi-Tenant

Backend en **NestJS + TypeScript + Prisma 7 + PostgreSQL 18** para la plataforma
residencial "Minuta Digital" (minuta virtual, correspondencia, PQRS, reservas
de amenidades, control de visitantes y mercado interno).

## Arquitectura Multi-Tenant

Estrategia **schema-per-tenant** en PostgreSQL:

- **Base central** (`central_db`, esquema `public`): catálogo de `Tenant`
  (nombre, slug, `schemaName`, estado, contacto).
- **Esquema por tenant** (ej: `conjunto_los_pinos`): contiene `User`,
  `Resident`, `Visitor`, `Correspondence`, `AmenityBooking`, `PqrsTicket`,
  `MarketplacePost`.
- El JWT emitido en `AuthService` incluye `tenantId` y `tenantSchema`.
  `JwtStrategy` decodifica el token en cada request y `PrismaTenantService`
  usa `tenantSchema` para instanciar/reutilizar el `PrismaClient` que apunta
  al esquema PostgreSQL correcto — sin tocar nunca la base central.
- Los archivos en S3/MinIO se aíslan por tenant con la key:
  `{tenantId}/{module}/{uuid}-{fileName}`.

## Estructura de carpetas

```
prisma/
  central/schema.prisma   # Modelo Tenant (base central)
  tenant/schema.prisma    # Modelos de dominio (aplicado a cada esquema tenant)
  seed.ts
src/
  auth/                   # AuthService, JwtStrategy, guards
  common/                 # decorators, interfaces (JwtPayload), guards compartidos
  config/                 # ConfigModule (configuration.ts)
  prisma/                 # PrismaCentralService + PrismaTenantService
  storage/                # StorageService (S3/MinIO) con aislamiento por tenant
  notifications/          # WebSocket Gateway (Socket.IO) por rooms de tenant
  webhooks/               # WebhooksController (pagos, WhatsApp)
  tenants/                # Alta/gestión de tenants (admin)
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
# Base central (tabla tenants)
npm run prisma:migrate:central

# Esquema de un tenant específico (ajusta TENANT_DATABASE_URL antes de correr)
TENANT_DATABASE_URL="postgresql://minuta_admin:minuta_pass@localhost:5432/central_db?schema=demo" \
  npx prisma migrate dev --schema=prisma/tenant/schema.prisma
```

## Seed de datos de ejemplo

```bash
npm run prisma:seed
```

Crea el tenant `demo` y el usuario `admin@demo.minutadigital.com` / `Admin123!`.

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
