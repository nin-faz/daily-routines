import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  TrendingUp,
  Flame,
  BarChart3,
  SkipForward,
  Calendar,
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
                <h3 className="font-semibold mb-1">Taux de routines</h3>
                <p className="text-sm text-muted-foreground">
                  Pourcentage de routines complétées sur une période.
                  <span className="block mt-1 text-xs">
                    Exemple : 7 routines complétées sur 10 prévues = 70%
                  </span>
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
                <h3 className="font-semibold mb-1">Streaks (Séries)</h3>
                <p className="text-sm text-muted-foreground">
                  Nombre de jours consécutifs où vous avez complété au moins une
                  routine.
                  <span className="block mt-1 text-xs">
                    Objectif : maintenir la régularité et ne pas casser la série
                    !
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
                  Taux de réussite vs Score global
                </h3>
                <p className="text-sm text-muted-foreground">
                  Le taux peut être calculé par routine, par jour, ou
                  globalement.
                  <span className="block mt-1 text-xs">
                    "Score global" = toutes les routines agrégées sur la période
                  </span>
                </p>
              </div>
            </section>

            {/* Sauter une routine */}
            <section className="flex gap-3 p-3 rounded-lg bg-muted/50 transition-all duration-200 hover:bg-muted/70 hover:scale-[1.02] hover:shadow-md cursor-default">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <SkipForward className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Sauter une routine</h3>
                <p className="text-sm text-muted-foreground">
                  Une routine sautée n'est ni complétée ni comptabilisée.
                  <span className="block mt-1 text-xs">
                    Elle est exclue du calcul des taux
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
                <h3 className="font-semibold mb-1">Taux moyen (semaine)</h3>
                <p className="text-sm text-muted-foreground">
                  Moyenne des pourcentages de chaque jour de la semaine.
                  <span className="block mt-1 text-xs">
                    Exemple : Lun 80%, Mar 60%, Mer 100% → Moyenne = 80%
                  </span>
                </p>
              </div>
            </section>

            <div className="flex justify-end pt-2">
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
