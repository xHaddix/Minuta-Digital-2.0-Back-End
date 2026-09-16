/**
 * Plantilla HTML estilizada (inline CSS para máxima compatibilidad con
 * clientes de correo) para el email de invitación/activación de cuenta.
 */
export interface ActivationEmailParams {
  name: string;
  activationUrl: string;
  expiresInHours: number;
}

export function buildActivationEmailHtml({
  name,
  activationUrl,
  expiresInHours,
}: ActivationEmailParams): string {
  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Activa tu cuenta - Minuta Digital</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f5f7; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="background-color:#1d4ed8; padding:24px 32px;">
                  <h1 style="margin:0; color:#ffffff; font-size:20px; font-weight:600;">Minuta Digital</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  <h2 style="margin:0 0 16px; color:#111827; font-size:18px;">¡Hola, ${escapeHtml(name)}!</h2>
                  <p style="margin:0 0 16px; color:#374151; font-size:14px; line-height:1.6;">
                    Se ha creado una cuenta para ti en la plataforma <strong>Minuta Digital</strong>.
                    Para comenzar a usarla, activa tu cuenta y define tu contraseña haciendo clic
                    en el siguiente botón:
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                    <tr>
                      <td align="center" style="border-radius:6px; background-color:#1d4ed8;">
                        <a href="${activationUrl}"
                           style="display:inline-block; padding:12px 28px; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; border-radius:6px;">
                          Activar mi cuenta
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 8px; color:#6b7280; font-size:13px; line-height:1.6;">
                    Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
                  </p>
                  <p style="margin:0 0 16px; word-break:break-all; font-size:13px;">
                    <a href="${activationUrl}" style="color:#1d4ed8;">${activationUrl}</a>
                  </p>
                  <p style="margin:0; color:#9ca3af; font-size:12px; line-height:1.6;">
                    Este enlace expirará en <strong>${expiresInHours} horas</strong>. Si no
                    solicitaste esta cuenta, puedes ignorar este mensaje.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 32px; background-color:#f9fafb; border-top:1px solid #e5e7eb;">
                  <p style="margin:0; color:#9ca3af; font-size:11px; text-align:center;">
                    &copy; ${new Date().getFullYear()} Minuta Digital. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
