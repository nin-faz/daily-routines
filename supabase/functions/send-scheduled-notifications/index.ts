import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.6";

/** Fonction exécutée quand le cron job est déclenché */
serve(async (req) => {
  try {
    console.log("⏰ [CRON] send-scheduled-notifications déclenchée");

    // 🔒 SÉCURITÉ : Vérification de l'autorisation Machine-to-Machine
    const authHeader = req.headers.get("Authorization");
    const expectedSecret = Deno.env.get("CRON_SECRET");

    // Si le header Authorization ne correspond pas exactement à notre secret
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      console.error("❌ Tentative d'accès non autorisée au Cron");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.log("✅ Autorisation validée");

    // Créer le client Supabase avec service_role pour accéder à toutes les données
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Configuration des clés VAPID
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("❌ ERREUR: Clés VAPID manquantes");
      return new Response(
        JSON.stringify({ error: "Missing VAPID configuration" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
    console.log("✅ Clés VAPID chargées");

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const now = new Date();

    // 1. Calcul de l'heure UTC (pour les routines en BDD)
    const utcHours = now.getUTCHours().toString().padStart(2, "0");
    const utcMinutesInt = Math.floor(now.getUTCMinutes() / 15) * 15;
    const utcTimeForDB = `${utcHours}:${utcMinutesInt.toString().padStart(2, "0")}`;

    // 2. Calcul de l'heure de Paris (pour le rappel des tâches à 09:00)
    const parisFormatter = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parisParts = parisFormatter.formatToParts(now);
    const parisHour = parisParts.find((p) => p.type === "hour")?.value;
    const parisMinute = parisParts.find((p) => p.type === "minute")?.value;
    const parisTime = `${parisHour}:${parisMinute}`; // Heure précise pour le check

    console.log(
      `🌍 Heure UTC (BDD): ${utcTimeForDB} | 🗼 Heure Paris: ${parisTime}`,
    );

    // --- MISE À JOUR DES REQUÊTES ---

    // Récupérer toutes les routines à notifier à cette heure
    console.log(`🔍 Recherche des routines pour ${utcTimeForDB}...`);
    const { data: routines, error: routinesError } = await supabaseClient
      .from("routines")
      // Sélectionner aussi frequency et week_days pour pouvoir filtrer correctement
      .select("id, title, user_id, notification_time, frequency, week_days")
      .eq("notification_time", utcTimeForDB) // Si c'est égale à l'heure actuelle (UTC)
      .not("notification_time", "is", null) // S'assurer que notification_time n'est pas null
      .eq("is_archived", false); // Exclure les routines archivées

    if (routinesError) {
      console.error("❌ ERREUR recherche routines:", routinesError);
      return new Response(JSON.stringify({ error: routinesError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📋 Routines trouvées: ${routines?.length ?? 0}`);

    if (!routines || routines.length === 0) {
      console.log("ℹ️ Aucune routine à notifier à cette heure");
      // On continue car il se peut qu'on doive envoyer des rappels de tâches (au moment configuré)
    }

    // Filtrer les routines selon la fréquence et les jours choisis.
    const DAYS = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDay = DAYS[now.getDay()];

    const routinesToNotify = (routines ?? []).filter((r: any) => {
      try {
        const freq = (r.frequency || "daily").toString().toLowerCase();

        if (freq === "daily") return true;

        if (freq === "weekly") {
          const weekDays = r.week_days || r.weekDays || [];
          if (!Array.isArray(weekDays) || weekDays.length === 0) return false;
          return weekDays
            .map(String)
            .map((s: string) => s.toLowerCase())
            .includes(currentDay);
        }

        // Par défaut, notifier si on n'est pas certain
        return true;
      } catch (err) {
        console.warn("⚠️ Erreur lors du filtrage d'une routine:", err);
        return false;
      }
    });

    console.log(
      `📋 Routines après filtrage par jour: ${routinesToNotify.length}`,
    );

    // Grouper les routines par user_id (simple, sans assertions)
    console.log("👤 Groupement des routines par user...");
    const notificationsByUser: Record<
      string,
      Array<{
        id: string;
        title: string;
        user_id: string;
        notificationTime: string | null;
        type?: "routine" | "task";
        deadline?: string | null;
      }>
    > = {};

    // Utiliser les routines déjà filtrées par fréquence/jours
    for (const routine of routinesToNotify ?? []) {
      if (!routine?.user_id) {
        continue;
      }
      if (!notificationsByUser[routine.user_id]) {
        notificationsByUser[routine.user_id] = [];
      }
      // Marquer comme routine
      notificationsByUser[routine.user_id].push({
        id: routine.id,
        title: routine.title,
        user_id: routine.user_id,
        notificationTime: routine.notification_time,
        type: "routine",
      });
    }

    /**
     * Envoyer un rappel pour les tâches dont la deadline est demain, mais seulement à une heure précise (ex: 09:00)
     */
    const TASK_REMINDER_TIME = Deno.env.get("TASK_REMINDER_TIME");
    let tasksFoundCount = 0;

    // On compare l'heure de Paris avec ton réglage
    if (parisTime.startsWith(TASK_REMINDER_TIME)) {
      try {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
        const dd = String(tomorrow.getDate()).padStart(2, "0");
        const tomorrowStr = `${yyyy}-${mm}-${dd}`;

        console.log(
          `🔍 Recherche des tâches avec deadline demain (${tomorrowStr})...`,
        );
        const { data: tasks, error: tasksError } = await supabaseClient
          .from("tasks")
          .select("id, title, user_id, deadline, status")
          .eq("deadline", tomorrowStr)
          .not("deadline", "is", null)
          .neq("status", "done");

        if (tasksError) {
          console.error("❌ ERREUR recherche tasks:", tasksError);
        } else if (tasks && tasks.length > 0) {
          tasksFoundCount = tasks.length;
          // Fusionner les tâches dans notificationsByUser pour envoyer une notification groupée
          for (const t of tasks) {
            if (!t?.user_id) continue;
            if (!notificationsByUser[t.user_id])
              notificationsByUser[t.user_id] = [];
            notificationsByUser[t.user_id].push({
              id: t.id,
              title: t.title,
              user_id: t.user_id,
              notificationTime: null,
              type: "task",
              deadline: t.deadline,
            });
          }
        } else {
          console.log("ℹ️ Aucune tâche à notifier demain");
        }
      } catch (err) {
        console.warn("⚠️ Erreur lors de la recherche/merge des tâches:", err);
      }
    } else {
      console.log(
        `ℹ️ Pas de rappel de tâches à cette heure (${parisTime}), tâche envoyée seulement à ${TASK_REMINDER_TIME}`,
      );
    }

    const userIds = Object.keys(notificationsByUser);
    console.log(`👥 ${userIds.length} utilisateurs concernés`);

    // Récupérer les subscriptions des users concernés
    console.log("🔍 Recherche des subscriptions push...");
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (subsError) {
      console.error("❌ ERREUR recherche subscriptions:", subsError);
      return new Response(JSON.stringify({ error: subsError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`📱 Subscriptions trouvées: ${subscriptions?.length ?? 0}`);

    if (!subscriptions || subscriptions.length === 0) {
      console.log(
        "⚠️ Aucune subscription trouvée - les utilisateurs n'ont probablement pas activé les notifications",
      );
      return new Response(
        JSON.stringify({ message: "No subscriptions found" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Envoyer les notifications en parallèle pour éviter les timeouts
    console.log("📤 Envoi des notifications...");

    // Envoyer séparément une notification groupée pour les routines et une pour les tâches (si présentes)
    const notificationPromises: Promise<any>[] = [];

    for (const sub of subscriptions) {
      const userRoutines = notificationsByUser[sub.user_id];
      if (!userRoutines || userRoutines.length === 0) {
        // push a resolved failure to keep counts consistent
        notificationPromises.push(
          Promise.resolve({
            success: false,
            error: `No routines/tasks for user ${sub.user_id}`,
            userId: sub.user_id,
          }),
        );
        continue;
      }

      const tasks = userRoutines.filter((r) => r.type === "task");
      const routinesOnly = userRoutines.filter((r) => r.type === "routine");

      // If there are routines, send one grouped notification for them
      if (routinesOnly.length > 0) {
        const tag = `routines-${sub.user_id}-${utcTimeForDB}`;

        const routineMessages = [
          // brutal (75%)
          `La version de toi dans 5 ans te regarde faire quoi là ? 👀 {title}.`,
          `T'as dit 'demain' hier aussi. {title}. 😤`,
          `Tu scrolles encore ? Bref, {title} t'attend... 📵`,
          `Encore une journée à parler... ou tu fais {title} ? 😒`,
          `T'attends quoi exactement ? Un miracle ? {title}. ⚡`,
          `Ton téléphone fait plus de stats que toi là ? Allez {title}. 📱`,
          `Si tu peux pas faire {title}, t'es capable de quoi exactement ? 😶`,
          `Ça fait combien de temps que tu fuis {title} ? ⏰`,
          `À force de remettre {title}, tu remets ta propre vie. 🔥`,
          `L'excuse du jour, c'est quoi pour éviter {title} ? 🎯`,
          `Fais {title} ou arrête de rêver d'une meilleure version de toi. 🔥`,
          `T'es plus un(e) gamin(e). Fais {title}.`,

          // motivant (25%)
          `La discipline c'est pas un talent. C'est un choix. {title}. ⚡`,
          `T'es pas fait pour la médiocrité. {title} t'attend. 🔥`,
          `Chaque fois que tu fais {title}, la version d'hier perd. 👊`,
          `Un jour ou jour un. Fais {title}. 👊`,
        ];

        const body =
          routinesOnly.length === 1
            ? routineMessages[
                Math.floor(Math.random() * routineMessages.length)
              ].replace("{title}", routinesOnly[0].title)
            : [
                `T'as ${routinesOnly.length} routines qui attendent. T'as quoi comme excuse aujourd'hui ? 😒`,
                `${routinesOnly.length} routines. Pas une. Toutes. Maintenant. 💀`,
                `Tes routines te regardent. Depuis tout à l'heure. 👀`,
                `T'arrives même pas à en faire une ? ${routinesOnly.length} t'attendent. ⚡`,
                `${routinesOnly.length} routines. La version faible dit 'plus tard'. 🔥`,
              ][Math.floor(Math.random() * 5)];

        notificationPromises.push(
          (async () => {
            try {
              const payload = JSON.stringify({
                title: "Mes Routines ‼️",
                body,
                tag,
              });
              await webpush.sendNotification(sub.subscription, payload);
              console.log(
                `[PUSH SUCCESS] Routines User: ${sub.user_id.substring(0, 8)}`,
              );
              return {
                success: true,
                userId: sub.user_id,
                itemType: "routines",
              };
            } catch (error) {
              console.error(
                `[PUSH ERROR] Routines User: ${sub.user_id.substring(0, 8)} | Error: ${error.message}`,
              );
              if (error.statusCode === 410) {
                console.warn(
                  `[CLEANUP] Removing expired subscription for user: ${sub.user_id}`,
                );
                await supabaseClient.from("push_subscriptions").delete().match({
                  user_id: sub.user_id,
                  endpoint: sub.subscription.endpoint,
                });
              }
              return {
                success: false,
                error: error.message,
                userId: sub.user_id,
                itemType: "routines",
              };
            }
          })(),
        );
      }

      // If there are tasks, send one grouped notification for them (deadline tomorrow)
      if (tasks.length > 0) {
        const tag = `tasks-${sub.user_id}-${utcTimeForDB}`;

        const taskMessages = [
          // brutal
          `Demain t'auras pas dit qu'on t'avait pas prévenu. {title}. ⏰`,
          `{title} — le stress d'attendre ou l'avancer maintenant ? ⚡`,
          `L'ignorer ne fera pas disparaître {title}. Deadline demain. 😤`,
          // préventif
          `{title} deadline demain. 1h maintenant = 0 stress demain matin. ✅`,
          `Demain matin t'auras d'autres galères. Règle {title} ce soir. 🎯`,
        ];

        const body =
          tasks.length === 1
            ? taskMessages[
                Math.floor(Math.random() * taskMessages.length)
              ].replace("{title}", tasks[0].title)
            : [
                `${tasks.length} tâches deadline demain. T'attendais quoi exactement ? 😒`,
                `${tasks.length} tâches. Le stress d'attendre ou les avancer maintenant ? ⚡`,
                `Demain matin t'auras d'autres galères. ${tasks.length} tâches ce soir. 🎯`,
              ][Math.floor(Math.random() * 4)];

        notificationPromises.push(
          (async () => {
            try {
              const payload = JSON.stringify({
                title: "Rappel tâche ⚠️",
                body,
                tag,
              });
              await webpush.sendNotification(sub.subscription, payload);
              console.log(
                `[PUSH SUCCESS] Tasks User: ${sub.user_id.substring(0, 8)}`,
              );
              return { success: true, userId: sub.user_id, itemType: "tasks" };
            } catch (error) {
              console.error(
                `[PUSH ERROR] Tasks User: ${sub.user_id.substring(0, 8)} | Error: ${error.message}`,
              );
              if (error.statusCode === 410) {
                console.warn(
                  `[CLEANUP] Removing expired subscription for user: ${sub.user_id}`,
                );
                await supabaseClient.from("push_subscriptions").delete().match({
                  user_id: sub.user_id,
                  endpoint: sub.subscription.endpoint,
                });
              }
              return {
                success: false,
                error: error.message,
                userId: sub.user_id,
                itemType: "tasks",
              };
            }
          })(),
        );
      }
    }

    // Attendre tous les envois (allSettled continue même si certains échouent)
    console.log(
      `⏳ Attente de ${notificationPromises.length} notifications...`,
    );
    const results = await Promise.allSettled(notificationPromises);

    // Formater les résultats
    const finalResults = results.map((r) =>
      r.status === "fulfilled" ? r.value : { success: false, error: r.reason },
    );

    const successCount = finalResults.filter((r) => r.success).length;
    const failureCount = finalResults.filter((r) => !r.success).length;

    console.log(`📊 Résultats: ${successCount} succès, ${failureCount} échecs`);

    return new Response(
      JSON.stringify({
        message: "Notifications processed",
        time: parisTime,
        routinesFound: routines?.length ?? 0,
        tasksFound: tasksFoundCount,
        subscriptionsFound: subscriptions.length,
        successCount,
        failureCount,
        results: finalResults,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("❌ ERREUR INATTENDUE:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
