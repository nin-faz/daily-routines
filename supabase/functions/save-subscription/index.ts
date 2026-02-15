import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {    
    const authHeader = req.headers.get('Authorization')
    console.log('🔐 Authorization header:', authHeader ? '✅ présent' : '❌ absent')

    // Créer le client Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader ?? '' },
        },
      }
    )

    // La vérification manuelle (Indispensable avec --no-verify-jwt)
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      console.error('Erreur Auth:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('👤 User authentifié:', user ? `✅ ${user.id.substring(0, 8)}...` : '❌ null')

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Récupérer la subscription depuis le body
    const { subscription } = await req.json()

    if (!subscription || !subscription.endpoint) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription data' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // ÉTAPE 1 : Upsert la subscription (crée ou met à jour avec nouveau updated_at)
    // L'index unique sur (user_id, endpoint) empêche les doublons du même endpoint
    const { data: upsertedData, error: upsertError } = await supabaseClient
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: subscription.endpoint,
          subscription,
          updated_at: new Date().toISOString(), // Force la mise à jour de updated_at
        },
        {
          onConflict: 'user_id,endpoint'
        }
      )
      .select()

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError)
      return new Response(
        JSON.stringify({ error: upsertError.message }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('✅ Subscription upserted successfully')

    // ÉTAPE 2 : Nettoyage asynchrone des anciennes subscriptions (ne pas bloquer la réponse)
    // On lance ça en arrière-plan via un setTimeout
    setTimeout(async () => {
      try {
        const { count } = await supabaseClient
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        if (count && count > 3) {
          const { data: oldSubscriptions } = await supabaseClient
            .from('push_subscriptions')
            .select('id, endpoint')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: true })
            .limit(count - 3)

          if (oldSubscriptions && oldSubscriptions.length > 0) {
            const idsToDelete = oldSubscriptions.map(s => s.id)
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .in('id', idsToDelete)

            console.log(`🧹 Nettoyage: ${idsToDelete.length} anciennes subscriptions supprimées`)
          }
        }
      } catch (error) {
        console.error('Erreur lors du nettoyage en arrière-plan:', error)
      }
    }, 0)

    return new Response(
      JSON.stringify({ success: true, data: upsertedData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
