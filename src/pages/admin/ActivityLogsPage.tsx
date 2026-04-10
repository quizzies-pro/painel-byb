import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_email: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (entityFilter !== "all") query = query.eq("entity_type", entityFilter);
      const { data, error } = await query;
      if (error) toast.error("Erro ao carregar logs");
      else setLogs((data as ActivityLog[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [entityFilter]);

  const filtered = logs.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
    l.entity_type.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => new Date(d).toLocaleString("pt-BR");

  const actionColors: Record<string, string> = {
    create: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    update: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    delete: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs de Atividade</h1>
        <p className="text-sm text-muted-foreground mt-1">Histórico de ações administrativas</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por ação, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="course">Cursos</SelectItem>
            <SelectItem value="module">Módulos</SelectItem>
            <SelectItem value="lesson">Aulas</SelectItem>
            <SelectItem value="student">Alunos</SelectItem>
            <SelectItem value="payment">Pagamentos</SelectItem>
            <SelectItem value="enrollment">Matrículas</SelectItem>
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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ação</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entidade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ator</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono whitespace-nowrap">{formatDate(l.created_at)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={actionColors[l.action] || ""}>{l.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground">{l.entity_type}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{l.actor_email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{l.entity_id?.slice(0, 8) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
