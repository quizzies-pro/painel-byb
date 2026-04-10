import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, Copy, Shield } from "lucide-react";
import { toast } from "sonner";

interface Setting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
}

export default function SettingsPage() {
  const { user, role } = useAuth();
  const isSuperAdmin = role === "super_admin";
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ticto-webhook`;

  useEffect(() => {
    supabase.from("platform_settings").select("*").order("key").then(({ data, error }) => {
      if (error) toast.error("Erro ao carregar configurações");
      else setSettings((data as Setting[]) ?? []);
      setLoading(false);
    });
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value } : s));
  };

  const getBoolValue = (key: string) => settings.find((s) => s.key === key)?.value === "true";

  const handleSave = async () => {
    setSaving(true);
    for (const s of settings) {
      await supabase.from("platform_settings").update({ value: s.value, updated_by: user?.id }).eq("key", s.key);
    }
    setSaving(false);
    toast.success("Configurações salvas");
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success("URL copiada");
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground mt-1">Apenas Super Admins podem acessar as configurações</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-1">Configurações gerais da plataforma</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </div>

      {/* General */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Nome da Plataforma</Label>
            <Input value={settings.find((s) => s.key === "platform_name")?.value || ""} onChange={(e) => updateSetting("platform_name", e.target.value)} className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Fuso Horário</Label>
            <Input value={settings.find((s) => s.key === "timezone")?.value || ""} onChange={(e) => updateSetting("timezone", e.target.value)} className="bg-background border-border" />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Comentários</Label>
              <p className="text-xs text-muted-foreground">Permitir comentários globalmente</p>
            </div>
            <Switch checked={getBoolValue("allow_comments")} onCheckedChange={(v) => updateSetting("allow_comments", String(v))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Certificados</Label>
              <p className="text-xs text-muted-foreground">Emitir certificados por padrão</p>
            </div>
            <Switch checked={getBoolValue("has_certificate")} onCheckedChange={(v) => updateSetting("has_certificate", String(v))} />
          </div>
        </CardContent>
      </Card>

      {/* Access */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Acesso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Bloquear em Reembolso</Label>
              <p className="text-xs text-muted-foreground">Revogar acesso automaticamente</p>
            </div>
            <Switch checked={getBoolValue("block_on_refund")} onCheckedChange={(v) => updateSetting("block_on_refund", String(v))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Bloquear em Chargeback</Label>
              <p className="text-xs text-muted-foreground">Revogar acesso automaticamente</p>
            </div>
            <Switch checked={getBoolValue("block_on_chargeback")} onCheckedChange={(v) => updateSetting("block_on_chargeback", String(v))} />
          </div>
        </CardContent>
      </Card>

      {/* Integration */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Integração Ticto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">URL do Webhook</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="bg-background border-border font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyWebhookUrl}><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">Configure esta URL no painel da Ticto</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Token de Segurança</Label>
            <Input value={settings.find((s) => s.key === "ticto_webhook_token")?.value || ""} onChange={(e) => updateSetting("ticto_webhook_token", e.target.value)} className="bg-background border-border font-mono text-xs" placeholder="Token secreto para validar webhooks" />
          </div>
        </CardContent>
      </Card>

      {/* Admin Info */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sua Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-mono">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Papel</span>
            <Badge variant="outline">{role}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
