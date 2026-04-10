import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Enrollment = Tables<"enrollments"> & { students?: { name: string; email: string } | null; courses?: { title: string } | null };

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  expired: "bg-muted text-muted-foreground",
  canceled: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  blocked: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  active: "Ativa", expired: "Expirada", canceled: "Cancelada", blocked: "Bloqueada",
};

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from("enrollments").select("*, students(name, email), courses(title)").order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter as Enrollment["status"]);
    const { data, error } = await query;
    if (error) toast.error("Erro ao carregar matrículas");
    else setEnrollments((data as Enrollment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta matrícula?")) return;
    const { error } = await supabase.from("enrollments").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Matrícula excluída"); fetchData(); }
  };

  const filtered = enrollments.filter((e) =>
    e.students?.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.students?.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.courses?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Matrículas</h1>
          <p className="text-sm text-muted-foreground mt-1">{enrollments.length} matrículas registradas</p>
        </div>
        <Link to="/admin/enrollments/new">
          <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Nova Matrícula</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por aluno ou produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
            <SelectItem value="canceled">Canceladas</SelectItem>
            <SelectItem value="blocked">Bloqueadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma matrícula encontrada</div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aluno</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Origem</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expira</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{e.students?.name || "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{e.students?.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.courses?.title || "—"}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="font-mono text-xs">{e.origin}</Badge></td>
                  <td className="px-4 py-3"><Badge variant="outline" className={statusColors[e.status] || ""}>{statusLabels[e.status] || e.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(e.expires_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/enrollments/${e.id}`}><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit className="h-3.5 w-3.5" /></Button></Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
