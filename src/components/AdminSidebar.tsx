import { BookOpen, LayoutDashboard, Users, CreditCard, GraduationCap, Activity, Webhook, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

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

function LogoSection({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="px-3 pb-4">
      <NavLink to="/admin" end className="block">
        {collapsed ? (
          <img
            src="/logo-icon.png"
            alt="BYB"
            className="h-9 w-9 object-contain rounded-lg"
          />
        ) : (
          <img
            src="/logo-full.png"
            alt="The BYB"
            className="h-9 object-contain"
          />
        )}
      </NavLink>
    </div>
  );
}
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
        {renderGroup("Conteúdo", contentItems)}
        {renderGroup("Gestão", managementItems)}
        {renderGroup("Sistema", systemItems)}
      </SidebarContent>
    </Sidebar>
  );
}
