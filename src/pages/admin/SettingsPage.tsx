import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Copy, Shield, Settings2, Globe, FileText, Lock, Webhook, User, Check } from "lucide-react";
import { toast } from "sonner";

interface Setting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

type Tab = "general" | "content" | "access" | "integration" | "account";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "Geral", icon: <Settings2 className="h-4 w-4" /> },
  { id: "content", label: "Conteúdo", icon: <FileText className="h-4 w-4" /> },
  { id: "access", label: "Acesso", icon: <Lock className="h-4 w-4" /> },
  { id: "integration", label: "Integrações", icon: <Webhook className="h-4 w-4" /> },
  { id: "account", label: "Conta", icon: <User className="h-4 w-4" /> },
];

export default function SettingsPage() {
  const { user, role } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ticto-webhook`;

  useEffect(() => {
    supabase.from("platform_settings").select("*").order("key").then(({ data, error }) => {
      if (error) toast.error("Erro ao carregar configurações");
      else setSettings((data as Setting[]) ?? []);
      setLoading(false);
    });
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  };

  const getBoolValue = (key: string) => settings.find((s) => s.key === key)?.value === "true";
  const getStringValue = (key: string) => settings.find((s) => s.key === key)?.value || "";

  const handleSave = async () => {
    setSaving(true);
    for (const s of settings) {
      await supabase.from("platform_settings").update({ value: s.value, updated_by: user?.id }).eq("key", s.key);
    }
    setSaving(false);
    toast.success("Configurações salvas com sucesso");
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast.success("URL copiada para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie as configurações gerais da plataforma</p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
          {saving ? (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Salvar alterações
        </Button>
      </div>

      {/* Tabs + Content */}
      <div className="flex gap-8">
        {/* Sidebar Tabs */}
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

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-xl">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-medium mb-1">Informações Gerais</h2>
                <p className="text-xs text-muted-foreground mb-5">Dados básicos da sua plataforma</p>
                <Separator className="mb-5" />
              </div>

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
              <div>
                <h2 className="text-sm font-medium mb-1">Conteúdo</h2>
                <p className="text-xs text-muted-foreground mb-5">Configurações padrão para cursos e aulas</p>
                <Separator className="mb-5" />
              </div>

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
              <div>
                <h2 className="text-sm font-medium mb-1">Controle de Acesso</h2>
                <p className="text-xs text-muted-foreground mb-5">Regras automáticas de bloqueio de acesso</p>
                <Separator className="mb-5" />
              </div>

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

          {activeTab === "integration" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-medium mb-1">Integração Ticto</h2>
                <p className="text-xs text-muted-foreground mb-5">Configurações do webhook para receber pagamentos da Ticto</p>
                <Separator className="mb-5" />
              </div>

              <SettingField label="URL do Webhook" description="Configure esta URL no painel da Ticto para receber notificações">
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="bg-muted/50 font-mono text-xs cursor-default"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyWebhookUrl}
                    className="shrink-0 h-9 w-9"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </SettingField>

              <SettingField label="Token de Segurança" description="Token secreto para validar a autenticidade dos webhooks recebidos">
                <Input
                  value={getStringValue("ticto_webhook_token")}
                  onChange={(e) => updateSetting("ticto_webhook_token", e.target.value)}
                  placeholder="Insira o token secreto"
                  className="bg-background font-mono text-xs"
                />
              </SettingField>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-medium mb-1">Sua Conta</h2>
                <p className="text-xs text-muted-foreground mb-5">Informações do administrador logado</p>
                <Separator className="mb-5" />
              </div>

              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-mono">{user?.email}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Papel</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {role}
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
    </div>
  );
}

/* ---------- Reusable sub-components ---------- */

function SettingField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
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

function ToggleField({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
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
