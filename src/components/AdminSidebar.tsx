import { BookOpen, LayoutDashboard, Users, CreditCard, GraduationCap, Activity, Webhook, Settings, LogOut, ChevronsUpDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const contentItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Produtos", url: "/admin/courses", icon: BookOpen },
];

const managementItems = [
  { title: "Alunos", url: "/admin/students", icon: Users },
  { title: "Pagamentos", url: "/admin/payments", icon: CreditCard },
  { title: "Matrículas", url: "/admin/enrollments", icon: GraduationCap },
];

const systemItems = [
  { title: "Logs", url: "/admin/logs", icon: Activity },
  { title: "Webhooks", url: "/admin/webhooks", icon: Webhook },
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin_operacional: "Operacional",
};

function LogoSection({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="px-3 pb-4">
      <NavLink to="/admin" end className="block">
        {collapsed ? (
          <img src="/logo-icon.png" alt="BYB" className="h-9 w-9 object-contain rounded-lg" />
        ) : (
          <img src="/logo-full.png" alt="The BYB" className="h-9 object-contain" />
        )}
      </NavLink>
    </div>
  );
}

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, role, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";
  const displayEmail = user?.email || "";

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  const renderGroup = (label: string, items: typeof contentItems) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-3 mb-2">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/admin"}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  activeClassName="text-foreground bg-accent"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-sidebar pt-4">
        <LogoSection collapsed={collapsed} />
        {renderGroup("Conteúdo", contentItems)}
        {renderGroup("Gestão", managementItems)}
        {renderGroup("Sistema", systemItems)}
      </SidebarContent>

      <SidebarFooter className="border-t border-border bg-sidebar p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`w-full flex items-center rounded-md text-left hover:bg-accent transition-colors outline-none ${
              collapsed ? "justify-center p-1.5" : "gap-3 px-2 py-2"
            }`}>
              <div className={`rounded-full bg-muted flex items-center justify-center shrink-0 font-semibold text-foreground uppercase ${
                collapsed ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs"
              }`}>
                {displayName.charAt(0)}
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {roleLabels[role ?? ""] ?? role}
                    </p>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align={collapsed ? "center" : "start"} className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
