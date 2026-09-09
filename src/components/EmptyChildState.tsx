import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";

export function EmptyChildState({ message }: { message?: string }) {
  const { role } = useCurrentUser();
  const canCreate = role === "responsavel" || role === "admin";
  return (
    <Card className="mx-auto max-w-xl rounded-3xl border-2 border-dashed p-10 text-center shadow-card">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-4xl">
        🦸
      </div>
      <h2 className="mt-4 font-display text-2xl font-black">Nenhuma criança selecionada</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {message ??
          (canCreate
            ? "Cadastre a primeira criança para começar a aventura."
            : "Peça aos seus pais para vincular seu perfil de criança.")}
      </p>
      {canCreate && (
        <Button asChild variant="hero" size="lg" className="mt-5">
          <Link to="/criancas">
            <Users className="h-4 w-4" /> Gerenciar crianças
          </Link>
        </Button>
      )}
    </Card>
  );
}
