import { useEffect, useState } from "react";
import { BookOpen, LayoutDashboard, Users, CreditCard, GraduationCap, Activity, Webhook, Settings, LogOut, ChevronsUpDown, MessageSquare } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
  { title: "Mensagens", url: "/admin/messages", icon: MessageSquare },
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
    <div className={`pb-4 ${collapsed ? "px-2 flex justify-center" : "px-3"}`}>
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

function UserAvatar({ src, name, size = "md" }: { src: string | null; name: string; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClasses} rounded-full bg-muted flex items-center justify-center shrink-0 font-semibold text-foreground uppercase`}>
      {name.charAt(0)}
    </div>
  );
}

function useUnreadMessages() {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    const { count: c } = await supabase
      .from("lesson_messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_type", "student")
      .eq("is_read", false);
    setCount(c ?? 0);
  };

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel("unread_messages_badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "lesson_messages" }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return count;
}

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, role, avatarUrl, signOut } = useAuth();
  const unreadCount = useUnreadMessages();

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
        <SidebarMenu className={collapsed ? "items-center" : undefined}>
          {items.map((item) => {
            const badge = item.title === "Mensagens" && unreadCount > 0 ? unreadCount : 0;
            return (
              <SidebarMenuItem key={item.title} className={collapsed ? "flex justify-center" : undefined}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    end={item.url === "/admin"}
                    className={`flex items-center rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${collapsed ? "justify-center px-0 py-0" : "gap-3 px-3 py-2"}`}
                    activeClassName="text-foreground bg-accent"
                  >
                    <div className="relative shrink-0">
                      <item.icon className="h-4 w-4" />
                      {badge > 0 && collapsed && (
                        <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </div>
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.title}</span>
                        {badge > 0 && (
                          <span className="h-5 min-w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
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
              collapsed ? "justify-center p-2" : "gap-3 px-2 py-2"
            }`}>
              <UserAvatar src={avatarUrl} name={displayName} size={collapsed ? "md" : "md"} />
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
            <div className="flex items-center gap-3 px-2 py-2">
              <UserAvatar src={avatarUrl} name={displayName} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
              </div>
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
