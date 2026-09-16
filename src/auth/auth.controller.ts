import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ActivateAccountDto } from './dto/activate-account.dto';
import { ActivateAccountResponseDto } from './dto/activate-account-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ForgotPasswordResponseDto } from './dto/forgot-password-response.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordResponseDto } from './dto/reset-password-response.dto';
import { SwitchComplexDto } from './dto/switch-complex.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inicia sesión y retorna un JWT de acceso',
    description:
      'El JWT resultante incluye roleCode y los discriminadores organizationId ' +
      'y residentialComplexId usados para aislar las consultas multi-tenant.',
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('switch-complex')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ROLE_DEV', 'ROLE_ORG_ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Conmuta de conjunto residencial y emite un nuevo JWT de contexto',
    description:
      'Permite a Administradores de Organización y Desarrolladores seleccionar un ' +
      'conjunto residencial activo. Re-firma el JWT asociando el residentialComplexId verificado.',
  })
  async switchComplex(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SwitchComplexDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.switchComplex(user, dto);
  }

  @Post('activate-account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activa la cuenta de un usuario invitado y establece su contraseña',
    description:
      'Valida el token de activación enviado por correo y establece la contraseña del usuario.',
  })
  async activateAccount(@Body() dto: ActivateAccountDto): Promise<ActivateAccountResponseDto> {
    return this.authService.activateAccount(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicita el envío de un enlace de recuperación de contraseña',
    description: 'Responde un mensaje genérico para prevenir enumeración de correos.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restablece la contraseña usando el token recibido por correo',
    description: 'Valida el token de recuperación e inactiva los enlaces previos emitidos.',
  })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    return this.authService.resetPassword(dto);
  }
}
