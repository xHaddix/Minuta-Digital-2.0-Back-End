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
      <style>
        @media only screen and (max-width: 620px) {
          .email-shell { width: 100% !important; }
          .email-inner { width: 100% !important; }
          .email-content { padding-left: 20px !important; padding-right: 20px !important; }
          .email-title { font-size: 28px !important; }
          .email-body { font-size: 14px !important; }
          .email-button { font-size: 16px !important; }
        }
      </style>
    </head>
    <body style="margin:0; padding:0; background-color:#edf2f8; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#edf2f8; padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" class="email-shell" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background-color:#071f35; border:1px solid rgba(96,165,250,0.5); border-radius:26px; overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(90deg, #0d5fe2 0%, #0a4fb5 100%); padding:20px 28px; border-top-left-radius:26px; border-top-right-radius:26px;">
                  <div style="font-size:28px; line-height:1.2; font-weight:700; color:#ffffff; letter-spacing:-0.04em; margin:0;">
                    Minuta Digital
                  </div>
                </td>
              </tr>

              <tr>
                <td class="email-content" style="padding:28px 28px 0 28px;">
                  <div class="email-title" style="font-size:32px; line-height:1.2; font-weight:700; color:#f5f9ff; letter-spacing:-0.04em; margin:0 0 18px 0;">
                    ¿Olvidaste tu contraseña?
                  </div>
                  <p class="email-body" style="margin:0; color:#dfeaf6; font-size:15px; line-height:1.7;">
                    Ingresa tu correo electrónico y te enviaremos un enlace de recuperación.
                  </p>
                </td>
              </tr>

              <tr>
                <td class="email-content" style="padding:26px 28px 0 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(14,30,48,0.25); border:1px solid rgba(96,165,250,0.6); border-radius:12px;">
                    <tr>
                      <td style="padding:16px 18px; color:#e5f2ff; font-size:15px; font-weight:600;">
                        ${escapeHtml(name)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td class="email-content" style="padding:26px 28px 10px 28px;">
                  <a href="${resetUrl}" class="email-button" style="display:block; width:100%; max-width:100%; box-sizing:border-box; text-align:center; text-decoration:none; color:#ffffff; font-size:18px; font-weight:700; border-radius:12px; background:linear-gradient(135deg, #3b82f6 0%, #6d5ef6 100%); padding:18px 20px; border:1px solid rgba(147,197,253,0.4);">
                    Enviar enlace de recuperación
                  </a>
                </td>
              </tr>

              <tr>
                <td class="email-content" style="padding:18px 28px 28px 28px;">
                  <p style="margin:0 0 12px 0; color:#dfeaf6; font-size:13px; line-height:1.6;">
                    Este enlace expira en <strong style="color:#ffffff;">${expiresInMinutes} minutos</strong>. Si no solicitaste este cambio, puedes ignorar este mensaje.
                  </p>
                  <p style="margin:0; color:#9fb4ca; font-size:12px; line-height:1.7; word-break:break-all;">
                    <a href="${resetUrl}" style="color:#94c5ff; text-decoration:none;">${resetUrl}</a>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:0 28px 24px 28px;">
                  <div style="border-top:1px solid rgba(148,163,184,0.28); padding-top:20px; text-align:center; color:#b9cfe3; font-size:12px; line-height:1.6;">
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
