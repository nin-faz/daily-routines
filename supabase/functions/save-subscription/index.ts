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

    // ÉTAPE 2 : Compter le nombre de subscriptions de cet utilisateur
    const { count } = await supabaseClient
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // ÉTAPE 3 : Si l'utilisateur a plus de 3 subscriptions, supprimer les plus anciennes (par updated_at)
    if (count && count > 3) {
      // Récupérer les subscriptions triées par date de mise à jour (les plus anciennes en premier)
      const { data: oldSubscriptions } = await supabaseClient
        .from('push_subscriptions')
        .select('id, endpoint, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: true }) // Les plus vieilles d'abord
        .limit(count - 3) // Garder seulement 3, supprimer le reste

      if (oldSubscriptions && oldSubscriptions.length > 0) {
        const idsToDelete = oldSubscriptions.map(s => s.id)

        await supabaseClient
          .from('push_subscriptions')
          .delete()
          .in('id', idsToDelete)

        console.log(`🧹 Nettoyage: ${idsToDelete.length} anciennes subscriptions supprimées`)
        console.log(`   Endpoints supprimés: ${oldSubscriptions.map(s => s.endpoint.substring(0, 30) + '...').join(', ')}`)
      }
    }

    // ÉTAPE 4 : Récupérer le nombre final de subscriptions
    const { data: finalSubs } = await supabaseClient
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)

    console.log(`📱 User ${user.id.substring(0, 8)} a maintenant ${finalSubs?.length || 0} subscription(s) active(s)`)

    return new Response(
      JSON.stringify({ success: true, data: upsertedData, totalSubscriptions: finalSubs?.length || 0 }),
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
