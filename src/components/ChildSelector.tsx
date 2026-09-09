import { Link } from "@tanstack/react-router";
import { ChevronDown, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSelectedChild } from "@/lib/children";
import { useCurrentUser } from "@/lib/auth";

export function ChildSelector() {
  const { role } = useCurrentUser();
  const { child, children, setSelectedId, loading } = useSelectedChild();

  if (loading) return null;

  // Child users see only their own profile chip (no switcher).
  if (role === "crianca") {
    if (!child) return null;
    return (
      <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-bold">
        <span className="text-base">{child.avatar_emoji}</span>
        <span className="hidden sm:inline">{child.nome}</span>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <Button asChild variant="hero" size="sm">
        <Link to="/criancas">
          <Plus className="h-4 w-4" /> Cadastrar criança
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          <span className="text-base">{child?.avatar_emoji ?? "👤"}</span>
          <span className="hidden sm:inline">{child?.nome ?? "Selecionar"}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Trocar de criança</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={c.id === child?.id ? "bg-accent" : ""}
          >
            <span className="mr-2 text-base">{c.avatar_emoji}</span>
            <span className="font-semibold">{c.nome}</span>
            <span className="ml-auto text-xs text-muted-foreground">Nv {c.nivel}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/criancas">
            <Users className="mr-2 h-4 w-4" /> Gerenciar crianças
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
