import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.6'

/** Fonction exécutée quand le cron job est déclenché */
serve(async (req) => {
  try {
    console.log('⏰ [CRON] send-routine-notifications déclenchée')

    // Créer le client Supabase avec service_role pour accéder à toutes les données
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Configuration des clés VAPID
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('VAPID_SUBJECT')

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ ERREUR: Clés VAPID manquantes')
      return new Response(
        JSON.stringify({ error: 'Missing VAPID configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    console.log('✅ Clés VAPID chargées')

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    // Obtenir l'heure actuelle arrondie aux 15 minutes
    const now = new Date()
    const minutes = Math.floor(now.getMinutes() / 15) * 15
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    console.log(`⏱️ Heure actuelle (arrondie): ${currentTime}`)

    // Récupérer toutes les routines à notifier à cette heure
    console.log(`🔍 Recherche des routines pour ${currentTime}...`)
    const { data: routines, error: routinesError } = await supabaseClient
      .from('routines')
      .select('id, title, user_id, notification_time')
      .eq('notification_time', currentTime) // Si c'est égale à l'heure actuelle
      .not('notification_time', 'is', null) // S'assurer que notification_time n'est pas null

    if (routinesError) {
      console.error('❌ ERREUR recherche routines:', routinesError)
      return new Response(
        JSON.stringify({ error: routinesError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Routines trouvées: ${routines?.length ?? 0}`)

    if (!routines || routines.length === 0) {
      console.log('ℹ️ Aucune routine à notifier à cette heure')
      return new Response(
        JSON.stringify({ message: 'No routines to notify', time: currentTime }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Grouper les routines par user_id (simple, sans assertions)
    console.log('👤 Groupement des routines par user...')
    const routinesByUser: Record<string, Array<{
      id: string
      title: string
      user_id: string
      notificationTime: string | null
    }>> = {}

    for (const routine of routines ?? []) {
      if (!routine?.user_id) {
        continue
      }
      if (!routinesByUser[routine.user_id]) {
        routinesByUser[routine.user_id] = []
      }
      // Utilise bien le nom venant de la BDD : notification_time
      routinesByUser[routine.user_id].push({
        ...routine,
        notificationTime: routine.notification_time 
    });
    }

    const userIds = Object.keys(routinesByUser)
    console.log(`👥 ${userIds.length} utilisateurs concernés`)

    // Récupérer les subscriptions des users concernés
    console.log('🔍 Recherche des subscriptions push...')
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)

    if (subsError) {
      console.error('❌ ERREUR recherche subscriptions:', subsError)
      return new Response(
        JSON.stringify({ error: subsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📱 Subscriptions trouvées: ${subscriptions?.length ?? 0}`)

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ Aucune subscription trouvée - les utilisateurs n\'ont probablement pas activé les notifications')
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Envoyer les notifications en parallèle pour éviter les timeouts
    console.log('📤 Envoi des notifications...')

    const notificationPromises = subscriptions.map(async (sub) => {
      const userRoutines = routinesByUser[sub.user_id]

      if (!userRoutines || userRoutines.length === 0) return { success: false, error: `No routines for user ${sub.user_id}` };

      const isGrouped = userRoutines.length > 1;
      const tag = isGrouped 
      ? `group-${sub.user_id}-${currentTime}` 
      : `routine-${userRoutines[0].id}`;

      const reminderMessages = [
        `C'est l'heure ! Ta routine "${userRoutines[0].title}" n'attend que toi. 🚀`,
        `Toc toc ! On oublie pas "${userRoutines[0].title}" ? On lâche rien ! 💪`,
        `Petit rappel amical : c'est le moment de briller avec : ${userRoutines[0].title}. ✨`,
        `Hop hop hop ! "${userRoutines[0].title}" ne va pas se faire toute seule. 😉`
      ];

      const randomSingleMessage = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];


      const notificationContent = {
        title: 'Mes Routines',
        body: isGrouped 
          ? `Combo ! C'est l'heure de tes routines : ${userRoutines.map(r => r.title).join(', ')} ⚡`
          : randomSingleMessage,
        tag: tag
      };

      try {
        const payload = JSON.stringify(notificationContent);

        await webpush.sendNotification(sub.subscription, payload);

        console.log(`[PUSH SUCCESS] User: ${sub.user_id.substring(0, 8)} | Type: ${isGrouped ? 'Group' : 'Single'}`);

        return { 
          success: true, 
          userId: sub.user_id, 
          type: isGrouped ? 'grouped' : 'single' 
        };
      } catch (error) {
        console.error(`[PUSH ERROR] User: ${sub.user_id.substring(0, 8)} | Error: ${error.message}`);

        // Gestion spécifique de l'expiration du token (HTTP 410 Gone)
        if (error.statusCode === 410) {
          console.warn(`[CLEANUP] Removing expired subscription for user: ${sub.user_id}`);
          await supabaseClient
            .from('push_subscriptions')
            .delete()
            .match({ 
              user_id: sub.user_id, 
              endpoint: sub.subscription.endpoint 
            });
        }

        return { success: false, error: error.message, userId: sub.user_id };
      }
    })

    // Attendre tous les envois (allSettled continue même si certains échouent)
    console.log(`⏳ Attente de ${notificationPromises.length} notifications...`)
    const results = await Promise.allSettled(notificationPromises)

    // Formater les résultats
    const finalResults = results.map(r => 
      r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }
    )

    const successCount = finalResults.filter(r => r.success).length
    const failureCount = finalResults.filter(r => !r.success).length

    console.log(`📊 Résultats: ${successCount} succès, ${failureCount} échecs`)

    return new Response(
      JSON.stringify({ 
        message: 'Notifications processed',
        time: currentTime,
        routinesFound: routines.length,
        subscriptionsFound: subscriptions.length,
        successCount,
        failureCount,
        results: finalResults
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ ERREUR INATTENDUE:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
