import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useGameStore } from "@/state/gameStore";
import { Trophy, Frown } from "lucide-react";

/**
 * Muestra un modal de fin de partida (Victoria o Derrota)
 * cuando el estado del juego cambia a 'finished'.
 */
export function EndScreen() {
  const gameState = useGameStore((state) => state.gameState);
  const isFinished = gameState?.status === "finished";
  const reason = useGameStore((state) => state.gameOverReason);

  const handlePlayAgain = () => {
    // TODO: Implementar la lógica para volver al lobby o reiniciar.
    // Por ahora, simplemente recargamos la página.
    window.location.reload();
  };

  const isVictory = reason === "victory";

  return (
    <AlertDialog open={isFinished}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center items-center mb-4">
            {isVictory ? (
              <Trophy className="h-16 w-16 text-yellow-500" />
            ) : (
              <Frown className="h-16 w-16 text-red-500" />
            )}
          </div>
          <AlertDialogTitle className="text-center text-2xl font-bold">
            {isVictory ? "¡Victoria!" : "Derrota"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {isVictory
              ? "¡Habéis defendido la base con éxito!"
              : "Los monstruos han destruido vuestra base."}
            <br />
            ¡Gracias por jugar!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handlePlayAgain} className="w-full">
            Jugar de Nuevo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
