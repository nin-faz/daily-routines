import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.6";

serve(async (req) => {
  try {
    console.log("📊 [CRON] send-weekly-summary déclenchée");

    // 🔒 Vérification du secret machine-to-machine
    const authHeader = req.headers.get("Authorization");
    const expectedSecret = Deno.env.get("CRON_SECRET");

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      console.error("❌ Tentative d'accès non autorisée");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Configuration des clés VAPID pour le Web Push
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: "Missing VAPID configuration" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    const now = new Date();

    // Calcul des 7 derniers jours (aujourd'hui inclus) au format YYYY-MM-DD UTC
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(d.getUTCDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    const weekStart = dates[0];
    const weekEnd = dates[6];

    // Récupération de toutes les subscriptions push actives
    const { data: subscriptions, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subsError || !subscriptions || subscriptions.length === 0) {
      console.log("ℹ️ Aucune subscription trouvée");
      return new Response(JSON.stringify({ message: "No subscriptions" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Dédoublonnage des user_id (un user peut avoir plusieurs appareils)
    const userIds = [...new Set(subscriptions.map((s: any) => s.user_id))];

    // Statuses de la semaine : taux hebdomadaire + jours complets
    const { data: weekStatuses, error: weekError } = await supabase
      .from("routine_statuses")
      .select("user_id, date, completed, skipped")
      .in("user_id", userIds)
      .gte("date", weekStart)
      .lte("date", weekEnd);

    if (weekError) {
      console.error("❌ Erreur routine_statuses:", weekError);
      return new Response(JSON.stringify({ error: weekError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Statuses des 60 derniers jours pour calculer le streak actuel
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setUTCDate(sixtyDaysAgo.getUTCDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split("T")[0];

    const { data: streakStatuses } = await supabase
      .from("routine_statuses")
      .select("user_id, date, completed, skipped")
      .in("user_id", userIds)
      .gte("date", sixtyDaysAgoStr)
      .lte("date", weekEnd);

    const promises: Promise<any>[] = [];

    for (const sub of subscriptions) {
      const userId = sub.user_id;

      // On exclut les jours de repos (skipped) — ils ne pénalisent pas le taux
      const nonSkipped = (weekStatuses ?? []).filter(
        (s: any) => s.user_id === userId && !s.skipped,
      );
      if (nonSkipped.length === 0) continue;

      // Taux de complétion hebdomadaire
      const completedCount = nonSkipped.filter((s: any) => s.completed).length;
      const weeklyRate = Math.round((completedCount / nonSkipped.length) * 100);

      // Regroupement par date pour identifier les jours à 100%
      const byDate: Record<string, { total: number; completed: number }> = {};
      for (const s of nonSkipped) {
        if (!byDate[s.date]) byDate[s.date] = { total: 0, completed: 0 };
        byDate[s.date].total++;
        if (s.completed) byDate[s.date].completed++;
      }
      const totalDaysWithData = Object.keys(byDate).length;
      const daysComplete = Object.values(byDate).filter(
        (d) => d.completed === d.total,
      ).length;

      // Calcul du streak : on remonte jour par jour depuis hier jusqu'au premier jour incomplet
      const streakByDate: Record<string, { total: number; completed: number }> =
        {};
      for (const s of (streakStatuses ?? []).filter(
        (s: any) => s.user_id === userId && !s.skipped,
      )) {
        if (!streakByDate[s.date])
          streakByDate[s.date] = { total: 0, completed: 0 };
        streakByDate[s.date].total++;
        if (s.completed) streakByDate[s.date].completed++;
      }

      let currentStreak = 0;
      const checkDate = new Date(now);
      checkDate.setUTCDate(checkDate.getUTCDate() - 1); // depuis hier (aujourd'hui peut être en cours)
      for (let i = 0; i < 60; i++) {
        const dateStr = checkDate.toISOString().split("T")[0];
        const day = streakByDate[dateStr];
        if (!day || day.total === 0 || day.completed < day.total) break;
        currentStreak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      }

      // Message dynamique selon 3 paliers de performance
      let title: string;
      let body: string;

      const streakSuffix = currentStreak > 0 ? ` Streak : ${currentStreak} jour${currentStreak > 1 ? "s" : ""}.` : "";

      if (weeklyRate >= 80) {
        title = "🔥 Résumé de ta semaine";
        body = `${weeklyRate}% de réussite — ${daysComplete}/${totalDaysWithData} jours complets.${streakSuffix}`;
      } else if (weeklyRate >= 50) {
        title = "📈 Résumé de ta semaine";
        body = `${weeklyRate}% cette semaine — ${daysComplete}/${totalDaysWithData} jours complets. La dynamique est là, on continue ?${streakSuffix}`;
      } else {
        title = "💪 Résumé de ta semaine";
        body = `${weeklyRate}% cette semaine — ${daysComplete}/${totalDaysWithData} jours complets. La semaine prochaine repart de zéro.${streakSuffix}`;
      }

      // Tag unique par user + semaine pour éviter les doublons en cas de re-déclenchement
      const tag = `weekly-summary-${userId}-${weekEnd}`;
      const payload = JSON.stringify({ title, body, tag });

      // Envoi en parallèle — allSettled garantit qu'un échec n'annule pas les autres
      promises.push(
        (async () => {
          try {
            await webpush.sendNotification(sub.subscription, payload);
            console.log(
              `[PUSH SUCCESS] User: ${userId.substring(0, 8)} | ${weeklyRate}%`,
            );
            return { success: true, userId, weeklyRate };
          } catch (error: any) {
            console.error(
              `[PUSH ERROR] User: ${userId.substring(0, 8)} | ${error.message}`,
            );
            // 410 = subscription expirée → on la supprime pour ne plus la retenter
            if (error.statusCode === 410) {
              await supabase
                .from("push_subscriptions")
                .delete()
                .match({
                  user_id: userId,
                  endpoint: sub.subscription.endpoint,
                });
            }
            return { success: false, error: error.message, userId };
          }
        })(),
      );
    }

    const results = await Promise.allSettled(promises);
    const final = results.map((r) =>
      r.status === "fulfilled" ? r.value : { success: false, error: r.reason },
    );
    const successCount = final.filter((r: any) => r.success).length;

    console.log(
      `📊 Weekly summaries: ${successCount}/${promises.length} envoyés`,
    );

    return new Response(
      JSON.stringify({
        message: "Weekly summaries sent",
        successCount,
        total: promises.length,
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
