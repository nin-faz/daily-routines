import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()
    const pseudo = record.pseudo || record.email.split('@')[0];
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Daily Routine <onboarding@resend.dev>',
        to: [record.email],
        subject: `Bienvenue sur ton tracker, ${pseudo} ! 🚀`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ea580c;">Hey ${pseudo} !</h1>
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