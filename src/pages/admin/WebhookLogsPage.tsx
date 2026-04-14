import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Copy, Trash2, Eye, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface WebhookEndpoint {
  id: string;
  name: string;
  source: string;
  slug: string;
  secret_token: string | null;
  is_active: boolean;
  description: string | null;
  created_at: string;
}

interface WebhookLog {
  id: string;
  source: string;
  event_type: string | null;
  payload: Record<string, unknown> | null;
  status: string;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
  webhook_endpoint_id: string | null;
}

const sourceOptions = [
  { value: "ticto", label: "Ticto" },
  { value: "hotmart", label: "Hotmart" },
  { value: "eduzz", label: "Eduzz" },
  { value: "kiwify", label: "Kiwify" },
  { value: "n8n", label: "N8N" },
  { value: "zapier", label: "Zapier" },
  { value: "custom", label: "Custom" },
];

const statusColors: Record<string, string> = {
  received: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  processed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  ignored: "bg-muted text-muted-foreground",
};

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function WebhookLogsPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [endpointFilter, setEndpointFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({ name: "", source: "custom", slug: "", secret_token: "", description: "" });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const getWebhookUrl = (slug: string) => `${supabaseUrl}/functions/v1/webhook-receiver/${slug}`;

  const fetchEndpoints = async () => {
    const { data } = await (supabase.from as any)("webhook_endpoints_secure").select("*").order("created_at", { ascending: false });
    setEndpoints((data as WebhookEndpoint[]) ?? []);
  };

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase.from("webhook_logs").select("*").order("created_at", { ascending: false }).limit(200);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (endpointFilter !== "all") query = query.eq("webhook_endpoint_id", endpointFilter);
    const { data } = await query;
    setLogs((data as WebhookLog[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchEndpoints(); }, []);
  useEffect(() => { fetchLogs(); }, [statusFilter, endpointFilter]);

  const handleCreateEndpoint = async () => {
    if (!newEndpoint.name || !newEndpoint.slug) { toast.error("Nome e slug são obrigatórios"); return; }
    const { error } = await supabase.from("webhook_endpoints").insert({
      name: newEndpoint.name,
      source: newEndpoint.source,
      slug: newEndpoint.slug,
      secret_token: newEndpoint.secret_token || null,
      description: newEndpoint.description || null,
    });
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Webhook criado");
      setShowCreate(false);
      setNewEndpoint({ name: "", source: "custom", slug: "", secret_token: "", description: "" });
      fetchEndpoints();
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from("webhook_endpoints").update({ is_active: !current }).eq("id", id);
    fetchEndpoints();
    toast.success(!current ? "Webhook ativado" : "Webhook desativado");
  };

  const handleDeleteEndpoint = async (id: string) => {
    if (!confirm("Excluir este webhook endpoint?")) return;
    const { error } = await supabase.from("webhook_endpoints").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Webhook excluído"); fetchEndpoints(); }
  };

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(getWebhookUrl(slug));
    toast.success("URL copiada!");
  };

  const filtered = logs.filter((l) =>
    l.event_type?.toLowerCase().includes(search.toLowerCase()) ||
    l.source.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => new Date(d).toLocaleString("pt-BR");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Webhooks</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie endpoints e visualize logs de webhooks</p>
        </div>
      </div>

      <Tabs defaultValue="endpoints" className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger value="endpoints" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Novo Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle>Novo Webhook Endpoint</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Nome *</Label>
                      <Input
                        value={newEndpoint.name}
                        onChange={(e) => {
                          setNewEndpoint((p) => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }));
                        }}
                        placeholder="Ex: Ticto Produção"
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Plataforma</Label>
                      <Select value={newEndpoint.source} onValueChange={(v) => setNewEndpoint((p) => ({ ...p, source: v }))}>
                        <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {sourceOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium">Slug (URL) *</Label>
                    <Input
                      value={newEndpoint.slug}
                      onChange={(e) => setNewEndpoint((p) => ({ ...p, slug: e.target.value }))}
                      className="bg-background border-border font-mono text-xs"
                    />
                    {newEndpoint.slug && (
                      <p className="text-[11px] text-muted-foreground font-mono break-all">{getWebhookUrl(newEndpoint.slug)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium">Token Secreto (opcional)</Label>
                    <Input
                      value={newEndpoint.secret_token}
                      onChange={(e) => setNewEndpoint((p) => ({ ...p, secret_token: e.target.value }))}
                      placeholder="Token para validar requisições"
                      className="bg-background border-border font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium">Descrição</Label>
                    <Textarea
                      value={newEndpoint.description}
                      onChange={(e) => setNewEndpoint((p) => ({ ...p, description: e.target.value }))}
                      className="bg-background border-border"
                      rows={2}
                      placeholder="Notas sobre este webhook..."
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                    <Button onClick={handleCreateEndpoint}>Criar Webhook</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {endpoints.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhum webhook configurado</p>
              <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro endpoint para começar a receber webhooks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {endpoints.map((ep) => (
                <div key={ep.id} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-foreground text-sm">{ep.name}</h3>
                      <Badge variant="outline" className="text-[11px] font-mono">{ep.source}</Badge>
                      {!ep.is_active && <Badge variant="outline" className="text-[11px] bg-red-500/10 text-red-400 border-red-500/20">Inativo</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={ep.is_active} onCheckedChange={() => handleToggleActive(ep.id, ep.is_active)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteEndpoint(ep.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-background px-3 py-2 rounded border border-border text-muted-foreground truncate">
                      {getWebhookUrl(ep.slug)}
                    </code>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyUrl(ep.slug)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {ep.description && <p className="text-xs text-muted-foreground">{ep.description}</p>}
                  {ep.secret_token && (
                    <p className="text-[11px] text-muted-foreground">🔑 Token configurado — envie via header <code className="bg-background px-1 rounded">x-webhook-token</code></p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-6 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por evento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
            </div>
            <Select value={endpointFilter} onValueChange={setEndpointFilter}>
              <SelectTrigger className="w-[200px] bg-card border-border"><SelectValue placeholder="Endpoint" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Endpoints</SelectItem>
                {endpoints.map((ep) => <SelectItem key={ep.id} value={ep.id}>{ep.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] bg-card border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="received">Recebidos</SelectItem>
                <SelectItem value="processed">Processados</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
                <SelectItem value="ignored">Ignorados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Nenhum log encontrado</div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fonte</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Evento</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground text-xs font-mono whitespace-nowrap">{formatDate(l.created_at)}</td>
                      <td className="px-4 py-3 text-foreground">{l.source}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{l.event_type || "—"}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={statusColors[l.status] || ""}>{l.status}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Eye className="h-3.5 w-3.5" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg bg-card border-border">
                              <DialogHeader><DialogTitle>Webhook #{l.id.slice(0, 8)}</DialogTitle></DialogHeader>
                              <div className="space-y-3 text-sm">
                                {l.error_message && <div className="text-red-400 bg-red-500/10 p-2 rounded text-xs">{l.error_message}</div>}
                                <pre className="p-3 bg-background rounded text-xs font-mono overflow-auto max-h-80">{JSON.stringify(l.payload, null, 2)}</pre>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
