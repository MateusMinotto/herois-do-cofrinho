import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChildSelector } from "@/components/ChildSelector";
import { useSelectedChild } from "@/lib/children";
import { ensureSprintForChild } from "@/lib/sprints";
import mascotImg from "@/assets/mascot.png";

export const Route = createFileRoute("/_authenticated/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { child } = useSelectedChild();
  const qc = useQueryClient();
  useEffect(() => {
    if (!child?.id) return;
    ensureSprintForChild(child.id)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["tasks", child.id] });
        qc.invalidateQueries({ queryKey: ["current-sprint", child.id] });
        qc.invalidateQueries({ queryKey: ["sprints", child.id] });
      })
      .catch((e) => console.error("ensureSprint", e));
  }, [child?.id, qc]);
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="hidden sm:inline font-display text-sm font-bold text-muted-foreground">
                {child ? `Olá, ${child.nome}! 👋` : "Heróis do Cofrinho"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ChildSelector />
              {child && (
                <div className="flex items-center gap-1.5 rounded-full bg-gradient-coin px-3 py-1 text-coin-foreground shadow-sm">
                  <span className="text-base">🪙</span>
                  <span className="font-display font-black">{child.pontos}</span>
                </div>
              )}
              <img src={mascotImg} alt="" width={36} height={36} className="h-9 w-9 hidden sm:block" />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
