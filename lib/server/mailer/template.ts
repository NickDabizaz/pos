export type TautanEmailTemplateInput = {
  heading    : string;
  ajakan     : string;
  buttonLabel: string;
  url        : string;
  token      : string;
  catatanKaki: string;
};

export function tautanEmailTemplate({ heading, ajakan, buttonLabel, url, token, catatanKaki }: TautanEmailTemplateInput): string {
  return `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:32px 16px;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
            <tr>
              <td align="center" style="padding-bottom:16px;">
                <span style="display:inline-block;border:1px solid #e2e8f0;background-color:#f1f5f9;border-radius:9999px;padding:4px 12px;font-size:12px;font-weight:500;color:#64748b;">
                  POS Boilerplate
                </span>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:8px;">
                <h1 style="margin:0;font-size:20px;font-weight:700;color:#0f172a;">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">${ajakan}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${url}" data-token="${token}" style="display:inline-block;background-color:#0f172a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:10px 24px;border-radius:8px;">
                  ${buttonLabel}
                </a>
              </td>
            </tr>
            <tr>
              <td align="center">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;">${catatanKaki}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
