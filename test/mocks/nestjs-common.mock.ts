/**
 * Mock ligero de `@nestjs/common` para pruebas unitarias aisladas.
 * ----------------------------------------------------------------------------
 * NestJS v12 distribuye sus paquetes como ESM puro, lo cual es incompatible
 * con la transformación CommonJS que usa ts-jest en este proyecto. Dado que
 * las pruebas unitarias de servicios (ej. AuthService) no necesitan levantar
 * el contenedor de inyección de dependencias real, se sustituye el paquete
 * por este stub que replica únicamente las piezas utilizadas en tiempo de
 * ejecución: el decorador `@Injectable()` (no-op) y las clases de excepción
 * HTTP relevantes.
 */

export function Injectable(): ClassDecorator {
  return () => undefined;
}

export class Logger {
  constructor(private readonly context?: string) {}
  log(...args: unknown[]): void {
    void args;
  }
  error(...args: unknown[]): void {
    void args;
  }
  warn(...args: unknown[]): void {
    void args;
  }
  debug(...args: unknown[]): void {
    void args;
  }
  verbose(...args: unknown[]): void {
    void args;
  }
}

class HttpExceptionMock extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedException extends HttpExceptionMock {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class BadRequestException extends HttpExceptionMock {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class ForbiddenException extends HttpExceptionMock {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundException extends HttpExceptionMock {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}
