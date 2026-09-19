import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Waitlist = Tables<"product_waitlists"> & { courses: Pick<Tables<"courses">, "title" | "available_for_sale"> | null };
type Member = Tables<"product_waitlist_members">;

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

export default function WaitlistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions } = useAuth();
  const canManage = Boolean((permissions?.waitlists as { manage?: boolean } | undefined)?.manage);
  const [waitlist, setWaitlist] = useState<Waitlist | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [listResult, membersResult] = await Promise.all([
      supabase.from("product_waitlists").select("*, courses(title, available_for_sale)").eq("id", id).single(),
      supabase.from("product_waitlist_members").select("*").eq("waitlist_id", id).order("consented_at", { ascending: false }),
    ]);
    if (listResult.error || !listResult.data) { toast.error("Lista não encontrada"); navigate("/admin/waitlists"); return; }
    setWaitlist(listResult.data as Waitlist);
    setMembers(membersResult.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const filtered = useMemo(() => members.filter((member) => {
    const term = search.trim().toLowerCase();
    const matches = !term || member.name_snapshot.toLowerCase().includes(term) || member.email_snapshot.toLowerCase().includes(term) || member.phone_snapshot.includes(term);
    return matches && (status === "all" || member.status === status);
  }), [members, search, status]);

  const changeStatus = async () => {
    if (!waitlist) return;
    const next = waitlist.status === "active" ? "closed" : "active";
    if (next === "active" && waitlist.courses?.available_for_sale) { toast.error("O produto já está disponível para venda"); return; }
    const { error } = await supabase.from("product_waitlists").update({ status: next }).eq("id", waitlist.id);
    if (error) toast.error(error.message); else { toast.success(next === "active" ? "Lista reaberta" : "Lista encerrada"); load(); }
  };

  const exportCsv = () => {
    const header = ["Nome", "E-mail", "Telefone", "Status", "Consentimento", "Versão", "Data do aceite", "Data de saída", "Origem"];
    const rows = filtered.map((member) => [member.name_snapshot, member.email_snapshot, member.phone_snapshot, member.status === "active" ? "Ativo" : "Saiu", "E-mail e WhatsApp", member.consent_version, new Date(member.consented_at).toLocaleString("pt-BR"), member.withdrawn_at ? new Date(member.withdrawn_at).toLocaleString("pt-BR") : "", member.source]);
    const csv = [header, ...rows].map((row) => row.map((cell) => csvCell(String(cell))).join(";")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    link.download = `lista-${waitlist?.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") ?? "espera"}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading || !waitlist) return <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  return <div className="space-y-6">
    <div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><Button variant="ghost" size="icon" onClick={() => navigate("/admin/waitlists")}><ArrowLeft /></Button><div><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold">{waitlist.name}</h1><Badge variant={waitlist.status === "active" ? "default" : "secondary"}>{waitlist.status === "active" ? "Ativa" : "Encerrada"}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{waitlist.courses?.title ?? "Produto não encontrado"} · {members.filter((member) => member.status === "active").length} interessados ativos</p></div></div><div className="flex gap-2">{canManage && <><Button variant="outline" onClick={changeStatus}>{waitlist.status === "active" ? "Encerrar lista" : "Reabrir lista"}</Button><Button asChild variant="outline"><Link to={`/admin/waitlists/${waitlist.id}/edit`}><Pencil />Editar</Link></Button></>}<Button onClick={exportCsv} disabled={filtered.length === 0}><Download />Exportar CSV</Button></div></div>

    <div className="grid max-w-4xl grid-cols-3 gap-4 border-y border-border py-5"><div><p className="text-xs text-muted-foreground">Criada em</p><p className="mt-1 text-sm font-medium">{new Date(waitlist.created_at).toLocaleDateString("pt-BR")}</p></div><div><p className="text-xs text-muted-foreground">Consentimento</p><p className="mt-1 text-sm font-medium">E-mail e WhatsApp · v{waitlist.consent_version}</p></div><div><p className="text-xs text-muted-foreground">Encerrada em</p><p className="mt-1 text-sm font-medium">{waitlist.closed_at ? new Date(waitlist.closed_at).toLocaleDateString("pt-BR") : "—"}</p></div></div>

    <div className="flex gap-3"><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nome, e-mail ou telefone..." className="flex-1" /><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="withdrawn">Saíram</SelectItem></SelectContent></Select></div>

    <div className="overflow-hidden rounded-lg border border-border"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-card"><th className="px-4 py-3 text-left font-medium text-muted-foreground">Interessado</th><th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th><th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th><th className="px-4 py-3 text-left font-medium text-muted-foreground">Aceite</th><th className="px-4 py-3 text-left font-medium text-muted-foreground">Origem</th></tr></thead><tbody>{filtered.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Nenhum interessado encontrado</td></tr> : filtered.map((member) => <tr key={member.id} className="border-b border-border last:border-0"><td className="px-4 py-3"><p className="font-medium">{member.name_snapshot}</p><p className="font-mono text-xs text-muted-foreground">{member.email_snapshot}</p></td><td className="px-4 py-3 text-muted-foreground">{member.phone_snapshot}</td><td className="px-4 py-3"><Badge variant={member.status === "active" ? "default" : "secondary"}>{member.status === "active" ? "Ativo" : "Saiu"}</Badge></td><td className="px-4 py-3"><p>{new Date(member.consented_at).toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">E-mail e WhatsApp · v{member.consent_version}</p></td><td className="px-4 py-3 text-muted-foreground">{member.source}</td></tr>)}</tbody></table></div>
  </div>;
}