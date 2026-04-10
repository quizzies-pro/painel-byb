import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";

interface WebhookLog {
  id: string;
  source: string;
  event_type: string | null;
  payload: Record<string, unknown> | null;
  status: string;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from("webhook_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) toast.error("Erro ao carregar logs");
      else setLogs((data as WebhookLog[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [statusFilter]);

  const filtered = logs.filter((l) =>
    l.event_type?.toLowerCase().includes(search.toLowerCase()) ||
    l.source.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => new Date(d).toLocaleString("pt-BR");

  const statusColors: Record<string, string> = {
    received: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    processed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    ignored: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Webhook Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">Registros de webhooks recebidos</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por evento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
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
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhum webhook registrado</div>
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
    </div>
  );
}
