import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

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
            <DialogTitle>Aide rapide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <section>
              <h3 className="font-semibold">Taux de routines</h3>
              <p className="text-sm text-muted-foreground">
                Le taux de routines correspond au pourcentage de routines
                complétées sur une période donnée. Par exemple, si vous avez 10
                routines prévues dans le mois et que 7 ont été marquées comme
                complétées, le taux est de 70%.
              </p>
            </section>

            <section>
              <h3 className="font-semibold">Streaks</h3>
              <p className="text-sm text-muted-foreground">
                Une streak indique le nombre de jours consécutifs où vous avez
                complété au moins une routine (ou la condition que vous avez
                choisie). Les streaks encouragent la régularité.
              </p>
            </section>

            <section>
              <h3 className="font-semibold">
                Completion rate vs. Overall completion
              </h3>
              <p className="text-sm text-muted-foreground">
                Le "taux de complétion" peut être calculé par routine, par jour,
                ou globalement. "Overall completion" agrège toutes les routines
                sur la période choisie.
              </p>
            </section>

            <section>
              <h3 className="font-semibold">Sauter une routine</h3>
              <p className="text-sm text-muted-foreground">
                Une routine sautée n'est pas considérée comme complétée et n'est
                pas prise en compte dans le calcul des taux de complétion (elle
                est exclue du numérateur et du dénominateur).
              </p>
            </section>

            <section>
              <h3 className="font-semibold">Taux moyen (semaine)</h3>
              <p className="text-sm text-muted-foreground">
                Le taux moyen pour une semaine est calculé à partir des
                pourcentages de chaque jour, on divise par le nombre de jours
                disponibles.
              </p>
            </section>

            <div className="flex justify-end">
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
