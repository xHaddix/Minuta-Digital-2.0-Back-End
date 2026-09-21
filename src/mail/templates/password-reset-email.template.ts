/**
 * Plantilla HTML estilizada (inline CSS para máxima compatibilidad con
 * clientes de correo) para el email de recuperación de contraseña.
 */
export interface PasswordResetEmailParams {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function buildPasswordResetEmailHtml({
  name,
  resetUrl,
  expiresInMinutes,
}: PasswordResetEmailParams): string {
  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Recupera tu contraseña - Minuta Digital</title>
    </head>
    <body style="margin:0; padding:0; background-color:#071b2d; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#071b2d; padding:48px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background-color:#071b2d; border:1px solid rgba(96,165,250,0.45); border-radius:28px; overflow:hidden;">
              <tr>
                <td style="padding:40px 40px 12px 40px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 18px auto;">
                    <tr>
                      <td align="center" valign="middle" style="width:52px; height:52px; border:1px solid rgba(125,211,252,0.7); border-radius:14px; background-color:rgba(148,163,184,0.08);">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Building icon" role="img">
                          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" stroke="#EAF3FF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M6 12h12" stroke="#EAF3FF" stroke-width="1.8" stroke-linecap="round"/>
                          <path d="M6 8h12" stroke="#EAF3FF" stroke-width="1.8" stroke-linecap="round"/>
                          <path d="M10 22v-6h4v6" stroke="#EAF3FF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </td>
                    </tr>
                  </table>

                  <div style="font-size: 30px; line-height: 1.2; font-weight: 700; color:#f8fbff; margin:0 0 8px 0; letter-spacing:-0.03em;">
                    Minuta Digital
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 8px 40px;">
                  <div style="font-size: 30px; line-height: 1.2; font-weight: 700; color:#f8fbff; margin:0; letter-spacing:-0.03em;">
                    ¿Olvidaste tu contraseña?
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 28px 40px;">
                  <p style="margin:0; color:#dfeaf6; font-size:15px; line-height:1.7; font-weight:400;">
                    Ingresa tu correo electrónico y te enviaremos un enlace de recuperación.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 28px 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(125,211,252,0.7); border-radius:12px; background-color:rgba(15,23,42,0.3);">
                    <tr>
                      <td style="padding:18px 18px; color:#dfeaf6; font-size:15px;">
                        <span style="display:inline-block; vertical-align:middle; margin-right:10px; font-size:18px;">✉️</span>
                        <span>${escapeHtml(name)}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 32px 40px;">
                  <a href="${resetUrl}" style="display:block; width:100%; max-width:100%; box-sizing:border-box; text-align:center; text-decoration:none; color:#ffffff; font-size:18px; font-weight:700; border-radius:12px; background:linear-gradient(135deg, #5b7cff 0%, #7c5cf7 100%); padding:18px 20px; border:1px solid rgba(147,197,253,0.4);">
                    Enviar enlace de recuperación
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 40px 40px;">
                  <p style="margin:0 0 12px 0; color:#bfcfe3; font-size:13px; line-height:1.6;">
                    Este enlace expira en <strong style="color:#ffffff;">${expiresInMinutes} minutos</strong>.
                    Si no solicitaste este cambio, puedes ignorar este mensaje.
                  </p>
                  <p style="margin:0; color:#9fb4ca; font-size:12px; line-height:1.7; word-break:break-all;">
                    <a href="${resetUrl}" style="color:#93c5fd; text-decoration:none;">${resetUrl}</a>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:0 40px 28px 40px;">
                  <div style="border-top:1px solid rgba(148,163,184,0.28); padding-top:18px; text-align:center; color:#9fb4ca; font-size:12px;">
                    © ${new Date().getFullYear()} Minuta Digital
                  </div>
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
