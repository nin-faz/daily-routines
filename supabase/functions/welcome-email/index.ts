import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

Deno.serve(async (req) => {
  try {
    const { record } = await req.json();
    const pseudo = record.pseudo || record.email.split("@")[0];
    const safePseudo = escapeHtml(pseudo);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Daily Routines <noreply@daily-routines.fr>",
        to: [record.email],
        subject: `${safePseudo}, bienvenue sur Daily Routines 👋`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">

            <div style="text-align: center; padding: 32px 0 24px;">
              <img src="https://daily-routines.fr/icon-512.png" width="64" height="64" alt="Daily Routines" style="border-radius: 16px; display: inline-block;" />
            </div>

            <h1 style="color: #ea580c; font-size: 24px; margin: 0 0 16px;">Bienvenue sur Daily Routines !</h1>

            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 12px;">
              Bonjour <span style="font-weight: 600;">${safePseudo}</span>,
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 12px;">
              Ton compte a bien été créé. Daily Routines est là pour t'aider à construire des habitudes solides, jour après jour.
            </p>

            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 28px;">
              Configure ta première routine et commence dès aujourd'hui.
            </p>

            <div style="text-align: center; margin: 0 0 32px;">
              <a href="https://daily-routines.fr" style="background-color: #ea580c; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: 600;">
                Commencer maintenant
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 0 0 24px;" />

            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right: 12px; vertical-align: middle;">
                  <img src="https://daily-routines.fr/icon-512.png" width="40" height="40" alt="Daily Routines" style="border-radius: 8px; display: block;" />
                </td>
                <td style="vertical-align: middle;">
                  <strong style="color: #ea580c; font-size: 14px;">Daily Routines</strong><br>
                  <span style="color: #999; font-size: 12px;">Cet email est envoyé automatiquement, merci de ne pas y répondre.</span><br>
                  <a href="https://daily-routines.fr" style="color: #ea580c; text-decoration: none; font-size: 12px;">daily-routines.fr</a>
                </td>
              </tr>
            </table>

          </div>
        `,
      }),
    });

    const responseData = await res.json();
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
