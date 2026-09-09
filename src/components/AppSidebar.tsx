import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, ListChecks, Gift, Target, BookOpen, Award, User, BarChart3, Sparkles, LogOut, Shield, Users, CalendarDays } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import mascot from "@/assets/mascot.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const childItems = [
  { title: "Meu Mundo", url: "/", icon: Home },
  { title: "Minhas Tarefas", url: "/tarefas", icon: ListChecks },
  { title: "Histórico de Sprints", url: "/sprints", icon: CalendarDays },
  { title: "Recompensas", url: "/recompensas", icon: Gift },
  { title: "Metas", url: "/metas", icon: Target },
  { title: "História do Dinheiro", url: "/historia", icon: BookOpen },
  { title: "Conquistas", url: "/conquistas", icon: Award },
  { title: "Meu Avatar", url: "/avatar", icon: User },
];

const parentItems = [
  { title: "Painel do Responsável", url: "/pais", icon: BarChart3 },
  { title: "Crianças", url: "/criancas", icon: Users },
];

const adminItems = [
  { title: "Administração", url: "/admin", icon: Shield },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isActive = (p: string) => pathname === p;

  async function handleLogout() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Até logo! 👋");
    navigate({ to: "/auth", replace: true });
  }


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <img src={mascot} alt="Capitão Cofrinho" width={40} height={40} className="h-10 w-10 animate-float" />
          <div className="leading-tight">
            <div className="font-display text-base font-bold text-primary">Heróis do</div>
            <div className="font-display text-base font-bold text-secondary -mt-1">Cofrinho</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Sparkles className="mr-1 h-3 w-3" /> Criança
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {childItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Responsável</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {parentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
