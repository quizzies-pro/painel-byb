import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Eye, Pencil, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Waitlist = Tables<"product_waitlists"> & { courses: Pick<Tables<"courses">, "title"> | null };

export default function WaitlistsPage() {
  const [waitlists, setWaitlists] = useState<Waitlist[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [listsResult, membersResult] = await Promise.all([
        supabase.from("product_waitlists").select("*, courses(title)").order("created_at", { ascending: false }),
        supabase.from("product_waitlist_members").select("waitlist_id").eq("status", "active"),
      ]);
      if (listsResult.error || membersResult.error) toast.error("Erro ao carregar listas de espera");
      else {
        setWaitlists((listsResult.data as Waitlist[]) ?? []);
        setCounts((membersResult.data ?? []).reduce<Record<string, number>>((result, member) => {
          result[member.waitlist_id] = (result[member.waitlist_id] ?? 0) + 1;
          return result;
        }, {}));
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => waitlists.filter((waitlist) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || waitlist.name.toLowerCase().includes(term) || waitlist.courses?.title.toLowerCase().includes(term);
    return matchesSearch && (status === "all" || waitlist.status === status);
  }), [search, status, waitlists]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Listas de espera</h1>
          <p className="mt-1 text-sm text-muted-foreground">{waitlists.length} listas cadastradas</p>
        </div>
        <Button asChild size="sm"><Link to="/admin/waitlists/new"><Plus />Nova lista</Link></Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por lista ou produto..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="active">Ativas</SelectItem><SelectItem value="closed">Encerradas</SelectItem></SelectContent>
        </Select>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div> : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center text-muted-foreground"><ClipboardList className="mb-3 h-8 w-8" /><p className="text-sm">Nenhuma lista encontrada</p></div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-card"><th className="px-4 py-3 text-left font-medium text-muted-foreground">Lista</th><th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th><th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th><th className="px-4 py-3 text-left font-medium text-muted-foreground">Interessados</th><th className="px-4 py-3 text-left font-medium text-muted-foreground">Criada em</th><th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th></tr></thead>
            <tbody>{filtered.map((waitlist) => <tr key={waitlist.id} className="border-b border-border last:border-0 hover:bg-card/50">
              <td className="px-4 py-3 font-medium">{waitlist.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{waitlist.courses?.title ?? "—"}</td>
              <td className="px-4 py-3"><Badge variant={waitlist.status === "active" ? "default" : "secondary"}>{waitlist.status === "active" ? "Ativa" : "Encerrada"}</Badge></td>
              <td className="px-4 py-3 font-mono">{counts[waitlist.id] ?? 0}</td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(waitlist.created_at).toLocaleDateString("pt-BR")}</td>
              <td className="px-4 py-3"><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon"><Link to={`/admin/waitlists/${waitlist.id}`} aria-label="Ver lista"><Eye /></Link></Button><Button asChild variant="ghost" size="icon"><Link to={`/admin/waitlists/${waitlist.id}/edit`} aria-label="Editar lista"><Pencil /></Link></Button></div></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}