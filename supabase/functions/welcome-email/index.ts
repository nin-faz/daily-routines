import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

/**
 * Sécurité (XSS/HTML Injection) : Échappe les caractères spéciaux pour empêcher l'interprétation de code HTML/JS malveillant.
 * Cela garantit que les données utilisateur sont affichées en tant que texte brut, même si elles contiennent des balises HTML ou des scripts.
 * C'est une mesure de sécurité essentielle pour protéger les utilisateurs contre les attaques XSS (Cross-Site Scripting).
 */
const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()

    // 1. Récupération de la donnée brute
    const pseudo = record.pseudo || record.email.split('@')[0];
    
    // 2. Assainissement OBLIGATOIRE avant toute utilisation dans une vue
    const safePseudo = escapeHtml(pseudo);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Daily Routine <onboarding@resend.dev>',
        to: [record.email],
        subject: `Bienvenue sur ton tracker, ${safePseudo} ! 🚀`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Hey ${safePseudo} !</h1>
            <p style="font-size: 16px; line-height: 1.5;">Ton profil a été créé avec succès sur <strong>Daily Routine</strong>.</p>
            <p style="font-size: 16px; line-height: 1.5;">C'est le moment idéal pour configurer ta première routine et commencer à construire tes habitudes.</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 14px; color: #666;">À très vite !<br>L'équipe <strong>Daily Routine</strong></p>
          </div>
        `,
      }),
    })

    const responseData = await res.json()

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})