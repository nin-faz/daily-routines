import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import {
  HelpCircle,
  TrendingUp,
  Flame,
  BarChart3,
  SkipForward,
  Calendar,
  ArchiveRestore,
  Palette,
} from "lucide-react";

export default function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Aide"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Aide rapide
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Taux de routines */}
            <section className="flex gap-3 p-3 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted/70 hover:scale-[1.02] hover:shadow-md cursor-default">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Taux de routines{" "}
                  <span className="block mt-1 text-xs">
                    <i>Stats</i>
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Pourcentage de routines complétées parmi celles prévues chaque
                  jour (les jours de repos ne sont pas comptés).
                </p>
              </div>
            </section>

            {/* Streaks */}
            <section className="flex gap-3 p-3 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted/70 hover:scale-[1.02] hover:shadow-md cursor-default">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Séries
                  <span className="block mt-1 text-xs">
                    <i>Détails de routine, Calendrier et Stats</i>
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Nombre de jours consécutifs où au moins une routine a été
                  complétée.
                  <span className="block mt-1 text-xs">
                    Objectif&nbsp;: maintenir la régularité et ne pas casser la série&nbsp;!
                  </span>
                </p>
              </div>
            </section>

            {/* Streak Revive */}
            <section className="flex gap-3 p-3 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted/70 hover:scale-[1.02] hover:shadow-md cursor-default">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-xl select-none">
                  🐦‍🔥
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Streak Éveil
                  <span className="block mt-1 text-xs">
                    <i>Routines</i>
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ranime ton streak si tu rates une journée. 1 éveil disponible
                  par semaine, il se recharge chaque lundi.
                  <span className="block mt-1 text-xs">
                    Apparaît automatiquement dans Routines quand ton streak est
                    en danger.
                  </span>
                </p>
              </div>
            </section>

            {/* Taux de réussite */}
            <section className="flex gap-3 p-3 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted/70 hover:scale-[1.02] hover:shadow-md cursor-default">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Taux de réussite
                  <span className="block mt-1 text-xs">
                    <i>Détails de routine, Calendrier et Stats</i>
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Correspond aux nombre de routines complétées par jour
                </p>
              </div>
            </section>

            {/* Jour de repos */}
            <section className="flex gap-3 p-3 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted/70 hover:scale-[1.02] hover:shadow-md cursor-default">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <SkipForward className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Jour de repos
                  <span className="block mt-1 text-xs">
                    <i>Routines</i>
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Si vous savez à l’avance que vous ne pourrez pas faire une
                  routine un jour donné, vous pouvez la marquer comme jour de
                  repos.
                  <span className="block mt-1 text-xs">
                    Elle n’est pas comptabilisée dans les calculs et ne pénalise
                    pas votre taux de réussite pour ce jour-là.
                  </span>
                </p>
              </div>
            </section>

            {/* Taux moyen semaine */}
            <section className="flex gap-3 p-3 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted/70 hover:scale-[1.02] hover:shadow-md cursor-default">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Taux moyen (semaine)
                  <span className="block mt-1 text-xs">
                    <i>Calendrier - Hebdomadaire</i>
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Moyenne des pourcentages de chaque jour de la semaine.
                  <span className="block mt-1 text-xs">
                    Exemple : Lun 80%, Mar 60%, Mer 100% → Moyenne = 80%
                  </span>
                </p>
              </div>
            </section>

            {/* Archivage & restauration */}
            <section className="flex gap-3 p-3 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted/70 hover:scale-[1.02] hover:shadow-md cursor-default">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                  <ArchiveRestore className="h-5 w-5 text-gray-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Archivage
                  <span className="block mt-1 text-xs">
                    <i>Routines, routines archivées</i>
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Archivez une routine pour la mettre de côté sans la supprimer.
                  <span className="block mt-1 text-xs">
                    Mais vous ne pouvez pas la restaurer une fois archivée.
                    Retouvez dans le menu en haut à droite.
                  </span>
                </p>
              </div>
            </section>

            {/* Personnalisation */}
            <section className="flex gap-3 p-3 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted/70 hover:scale-[1.02] hover:shadow-md cursor-default">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-purple-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Personnalisation</h3>
                <p className="text-sm text-muted-foreground">
                  Changez le thème et adaptez les couleurs de votre app.
                  <span className="block mt-1 text-xs">
                    Retrouvez ces options en haut à droite.
                  </span>
                </p>
              </div>
            </section>

            <div className="flex flex-col items-end pt-2 gap-1">
              <span className="w-full text-center text-xs text-muted-foreground">
                Astuce : vous pouvez fermer cette fenêtre avec la touche{" "}
                <b>Echap</b>.
              </span>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
