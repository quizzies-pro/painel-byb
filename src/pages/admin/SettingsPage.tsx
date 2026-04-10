import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Save,
  Shield,
  Settings2,
  FileText,
  Lock,
  User,
  Users,
  Plus,
  Trash2,
  Mail,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { PermissionsEditor, DEFAULT_PERMISSIONS, type Permissions } from "@/components/PermissionsEditor";

interface Setting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

interface AdminUser {
  user_id: string;
  email: string;
  role: string;
  permissions: Permissions;
  created_at: string;
  last_sign_in: string | null;
}

type Tab = "general" | "content" | "access" | "users" | "account";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "Geral", icon: <Settings2 className="h-4 w-4" /> },
  { id: "content", label: "Conteúdo", icon: <FileText className="h-4 w-4" /> },
  { id: "access", label: "Acesso", icon: <Lock className="h-4 w-4" /> },
  { id: "users", label: "Usuários", icon: <Users className="h-4 w-4" /> },
  { id: "account", label: "Conta", icon: <User className="h-4 w-4" /> },
];

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin_operacional: "Admin Operacional",
};

export default function SettingsPage() {
  const { user, role } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("general");

  // Users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editPermissions, setEditPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);
  const [editRole, setEditRole] = useState("admin_operacional");
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Invite state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin_operacional");
  const [invitePermissions, setInvitePermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    supabase
      .from("platform_settings")
      .select("*")
      .order("key")
      .then(({ data, error }) => {
        if (error) toast.error("Erro ao carregar configurações");
        else setSettings((data as Setting[]) ?? []);
        setLoading(false);
      });
  }, []);

  const fetchAdminUsers = async () => {
    setUsersLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        method: "GET",
      });
      if (error) throw error;
      setAdminUsers(data ?? []);
    } catch {
      toast.error("Erro ao carregar usuários");
    }
    setUsersLoading(false);
  };

  useEffect(() => {
    if (activeTab === "users" && isSuperAdmin) {
      fetchAdminUsers();
    }
  }, [activeTab, isSuperAdmin]);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  };

  const getBoolValue = (key: string) => settings.find((s) => s.key === key)?.value === "true";
  const getStringValue = (key: string) => settings.find((s) => s.key === key)?.value || "";

  const handleSave = async () => {
    setSaving(true);
    for (const s of settings) {
      await supabase
        .from("platform_settings")
        .update({ value: s.value, updated_by: user?.id })
        .eq("key", s.key);
    }
    setSaving(false);
    toast.success("Configurações salvas com sucesso");
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        method: "POST",
        body: {
          email: inviteEmail.trim(),
          role: inviteRole,
          permissions: inviteRole === "super_admin" ? DEFAULT_PERMISSIONS : invitePermissions,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success("Usuário adicionado com sucesso");
        setShowInviteDialog(false);
        setInviteEmail("");
        setInviteRole("admin_operacional");
        setInvitePermissions(DEFAULT_PERMISSIONS);
        fetchAdminUsers();
      }
    } catch {
      toast.error("Erro ao convidar usuário");
    }
    setInviting(false);
  };

  const handleSavePermissions = async () => {
    if (!editingUser) return;
    setSavingPermissions(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        method: "PATCH",
        body: {
          user_id: editingUser.user_id,
          role: editRole,
          permissions: editRole === "super_admin" ? DEFAULT_PERMISSIONS : editPermissions,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success("Permissões atualizadas");
        setEditingUser(null);
        fetchAdminUsers();
      }
    } catch {
      toast.error("Erro ao salvar permissões");
    }
    setSavingPermissions(false);
  };

  const handleRemoveUser = async (userId: string, email: string) => {
    if (!confirm(`Remover acesso de ${email}?`)) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        method: "DELETE",
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success("Acesso removido");
        fetchAdminUsers();
      }
    } catch {
      toast.error("Erro ao remover usuário");
    }
  };

  const openEditUser = (u: AdminUser) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditPermissions(u.permissions ?? DEFAULT_PERMISSIONS);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Shield className="h-5 w-5 text-muted-foreground" />
        </div>
        <h2 className="text-base font-medium">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Apenas Super Admins podem acessar as configurações da plataforma
        </p>
      </div>
    );
  }

  // Editing a specific user — show permissions editor full view
  if (editingUser) {
    const isSelf = editingUser.user_id === user?.id;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setEditingUser(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{editingUser.email}</h1>
              <p className="text-sm text-muted-foreground">Configurar permissões de acesso</p>
            </div>
          </div>
          <Button
            onClick={handleSavePermissions}
            disabled={savingPermissions || isSelf}
            size="sm"
            className="gap-2"
          >
            {savingPermissions ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Salvar permissões
          </Button>
        </div>

        <div className="max-w-xl space-y-6">
          {/* Role selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Papel</Label>
            <p className="text-xs text-muted-foreground">
              Super Admins têm acesso total. Permissões customizadas se aplicam a Admin Operacional.
            </p>
            <Select value={editRole} onValueChange={setEditRole} disabled={isSelf}>
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin_operacional">Admin Operacional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {editRole === "super_admin" ? (
            <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
              <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Acesso Total</p>
              <p className="text-xs text-muted-foreground mt-1">
                Super Admins têm todas as permissões ativadas automaticamente
              </p>
            </div>
          ) : (
            <PermissionsEditor
              permissions={editPermissions}
              onChange={setEditPermissions}
              disabled={isSelf}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as configurações gerais da plataforma
          </p>
        </div>
        {activeTab !== "users" && (
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
            {saving ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Salvar alterações
          </Button>
        )}
      </div>

      {/* Tabs + Content */}
      <div className="flex gap-8">
        <nav className="w-48 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0 max-w-xl">
          {activeTab === "general" && (
            <div className="space-y-6">
              <SectionHeader title="Informações Gerais" description="Dados básicos da sua plataforma" />
              <SettingField label="Nome da Plataforma" description="O nome exibido para os alunos">
                <Input
                  value={getStringValue("platform_name")}
                  onChange={(e) => updateSetting("platform_name", e.target.value)}
                  placeholder="Minha Plataforma"
                  className="bg-background"
                />
              </SettingField>
              <SettingField label="Fuso Horário" description="Usado para datas e relatórios">
                <Input
                  value={getStringValue("timezone")}
                  onChange={(e) => updateSetting("timezone", e.target.value)}
                  placeholder="America/Sao_Paulo"
                  className="bg-background"
                />
              </SettingField>
            </div>
          )}

          {activeTab === "content" && (
            <div className="space-y-6">
              <SectionHeader title="Conteúdo" description="Configurações padrão para cursos e aulas" />
              <ToggleField
                label="Comentários"
                description="Permitir que alunos comentem nos produtos"
                checked={getBoolValue("allow_comments")}
                onCheckedChange={(v) => updateSetting("allow_comments", String(v))}
              />
              <Separator />
              <ToggleField
                label="Certificados"
                description="Emitir certificados de conclusão automaticamente"
                checked={getBoolValue("has_certificate")}
                onCheckedChange={(v) => updateSetting("has_certificate", String(v))}
              />
            </div>
          )}

          {activeTab === "access" && (
            <div className="space-y-6">
              <SectionHeader title="Controle de Acesso" description="Regras automáticas de bloqueio de acesso" />
              <ToggleField
                label="Bloquear em Reembolso"
                description="Revogar acesso do aluno automaticamente quando houver reembolso"
                checked={getBoolValue("block_on_refund")}
                onCheckedChange={(v) => updateSetting("block_on_refund", String(v))}
              />
              <Separator />
              <ToggleField
                label="Bloquear em Chargeback"
                description="Revogar acesso do aluno automaticamente quando houver chargeback"
                checked={getBoolValue("block_on_chargeback")}
                onCheckedChange={(v) => updateSetting("block_on_chargeback", String(v))}
              />
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <SectionHeader
                  title="Usuários do Painel"
                  description="Gerencie quem tem acesso e o que cada pessoa pode fazer"
                />
                <Button size="sm" className="gap-2" onClick={() => setShowInviteDialog(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Convidar
                </Button>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
                </div>
              ) : adminUsers.length === 0 ? (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              ) : (
                <div className="rounded-lg border border-border divide-y divide-border">
                  {adminUsers.map((u) => {
                    const isSelf = u.user_id === user?.id;
                    return (
                      <button
                        key={u.user_id}
                        onClick={() => openEditUser(u)}
                        className="w-full flex items-center justify-between px-4 py-3 gap-4 hover:bg-accent/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {u.email}
                              {isSelf && (
                                <span className="text-xs text-muted-foreground ml-2">(você)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {u.last_sign_in
                                ? `Último login: ${new Date(u.last_sign_in).toLocaleDateString("pt-BR")}`
                                : "Nunca logou"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs font-mono">
                            {roleLabels[u.role] ?? u.role}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <SectionHeader title="Sua Conta" description="Informações do administrador logado" />
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-mono">{user?.email}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Papel</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {roleLabels[role ?? ""] ?? role}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">ID</span>
                  <span className="text-xs font-mono text-muted-foreground">{user?.id}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <SettingField label="Email" description="O usuário receberá um convite por email">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </SettingField>
            <SettingField label="Papel" description="Define as permissões base do usuário">
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin — acesso total</SelectItem>
                  <SelectItem value="admin_operacional">Admin Operacional — acesso customizado</SelectItem>
                </SelectContent>
              </Select>
            </SettingField>

            {inviteRole === "admin_operacional" && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm font-medium">Permissões</Label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                    Defina exatamente o que este usuário poderá ver e fazer
                  </p>
                  <PermissionsEditor
                    permissions={invitePermissions}
                    onChange={setInvitePermissions}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="gap-2"
            >
              {inviting ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Convidar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-sm font-medium mb-1">{title}</h2>
      <p className="text-xs text-muted-foreground mb-5">{description}</p>
      <Separator className="mb-5" />
    </div>
  );
}

function SettingField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function ToggleField({ label, description, checked, onCheckedChange }: { label: string; description: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
