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
    <body style="margin:0; padding:0; background-color:#f3f6fb; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f6fb; padding:32px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background-color:#ffffff; border:1px solid #dbe7f5; border-radius:20px; overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(90deg, #0d5fe2 0%, #0b4dba 100%); padding:22px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td valign="middle" style="width:42px; height:42px; border-radius:12px; background-color:rgba(255,255,255,0.12); text-align:center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Building icon" role="img">
                          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" stroke="#EAF3FF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M6 12h12" stroke="#EAF3FF" stroke-width="1.8" stroke-linecap="round"/>
                          <path d="M6 8h12" stroke="#EAF3FF" stroke-width="1.8" stroke-linecap="round"/>
                          <path d="M10 22v-6h4v6" stroke="#EAF3FF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </td>
                      <td style="padding-left:14px; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:-0.02em;">
                        Minuta Digital
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:32px 32px 8px 32px; color:#1f2937; font-size:16px; line-height:1.6;">
                  <div style="font-size:28px; line-height:1.2; font-weight:700; color:#111827; margin:0 0 16px 0;">
                    ¡Hola, ${escapeHtml(name)}!
                  </div>
                  <p style="margin:0; color:#374151; font-size:15px; line-height:1.8;">
                    Se ha creado una cuenta para ti en la plataforma <strong>Minuta Digital</strong>.
                    Para comenzar a usarla, activa tu cuenta y define tu contraseña haciendo clic en el siguiente botón:
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 32px 10px 32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="left">
                        <a href="${activationUrl}" style="display:inline-block; padding:16px 28px; background:linear-gradient(135deg, #0d5fe2 0%, #4f46e5 100%); border-radius:10px; color:#ffffff; text-decoration:none; font-size:18px; font-weight:700;">
                          Activar mi cuenta
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 32px 0 32px; color:#4b5563; font-size:13px; line-height:1.8;">
                  <p style="margin:0 0 8px 0;">
                    Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:
                  </p>
                  <p style="margin:0; word-break:break-all; color:#1d4ed8;">
                    <a href="${activationUrl}" style="color:#1d4ed8; text-decoration:none;">${activationUrl}</a>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:24px 32px 28px 32px; color:#6b7280; font-size:12px; line-height:1.8;">
                  <p style="margin:0;">
                    Este enlace expirará en <strong>${expiresInHours} horas</strong>. Si no solicitaste esta cuenta, puedes ignorar este mensaje.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:18px 32px 26px 32px; border-top:1px solid #edf1f6; text-align:center; color:#9ca3af; font-size:12px;">
                  © ${new Date().getFullYear()} Minuta Digital. Todos los derechos reservados.
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
