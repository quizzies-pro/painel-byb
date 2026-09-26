import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserRound } from "lucide-react";
import { toast } from "sonner";
import { usePreviousPage } from "@/hooks/usePreviousPage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudentAccessManager from "@/components/admin/StudentAccessManager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Student = Tables<"students">;
type Payment = Tables<"payments"> & { courses?: { title: string } | null };

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success-text border-success/30",
  blocked: "bg-destructive/10 text-destructive border-destructive/30",
  pending: "bg-warning/10 text-warning-text border-warning/30",
  canceled: "bg-muted text-muted-foreground",
  approved: "bg-success/10 text-success-text border-success/30",
  refunded: "bg-warning/10 text-warning-text border-warning/30",
  chargeback: "bg-destructive/10 text-destructive border-destructive/30",
  expired: "bg-muted text-muted-foreground",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
};

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = usePreviousPage("/admin/students");
  const [searchParams, setSearchParams] = useSearchParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [activeEnrollments, setActiveEnrollments] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", cpf: "", origin: "", status: "active" as Student["status"] });

  const fetchSummary = async () => {
    if (!id) return;
    const [studentResult, enrollmentsResult, paymentsResult] = await Promise.all([
      supabase.from("students").select("*").eq("id", id).single(),
      supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("student_id", id).eq("status", "active"),
      supabase.from("payments").select("*, courses(title)").eq("student_id", id).order("created_at", { ascending: false }),
    ]);
    if (studentResult.error || !studentResult.data) { toast.error("Aluno não encontrado"); navigate("/admin/students"); return; }
    setStudent(studentResult.data);
    setProfile({ name: studentResult.data.name, email: studentResult.data.email, phone: studentResult.data.phone || "", cpf: studentResult.data.cpf || "", origin: studentResult.data.origin || "", status: studentResult.data.status });
    setActiveEnrollments(enrollmentsResult.count ?? 0);
    setPayments((paymentsResult.data as Payment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); fetchSummary(); }, [id]);

  if (loading || !student) return <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  const formatDate = (date: string | null) => date ? new Date(date).toLocaleDateString("pt-BR") : "—";
  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const currentTab = searchParams.get("tab") || "access";
  const saveProfile = async () => {
    if (!profile.name.trim() || !profile.email.trim()) { toast.error("Nome e e-mail são obrigatórios"); return; }
    setSavingProfile(true);
    const { error } = await supabase.from("students").update({ ...profile, phone: profile.phone || null, cpf: profile.cpf || null, origin: profile.origin || null }).eq("id", student.id);
    if (error) toast.error("Não foi possível salvar os dados do aluno");
    else { setStudent((current) => current ? { ...current, ...profile, phone: profile.phone || null, cpf: profile.cpf || null, origin: profile.origin || null } : current); toast.success("Dados do aluno salvos"); }
    setSavingProfile(false);
  };
  const changeTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === "access") next.delete("tab"); else next.set("tab", tab);
    next.delete("product");
    setSearchParams(next, { replace: true });
  };

  return <div className="student-workspace space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft /></Button>
        <Avatar className="h-12 w-12 border border-border"><AvatarImage src={student.avatar_url || undefined} alt="" /><AvatarFallback><UserRound className="h-5 w-5" /></AvatarFallback></Avatar>
        <div><h1 className="workspace-title text-2xl font-semibold">{student.name}</h1><p className="text-sm text-muted-foreground">{student.email}</p></div>
      </div>
    </div>

    <div className="grid overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-4">
      <div className="border-b border-border p-4 sm:border-b-0 sm:border-r"><div className="text-xs text-muted-foreground">Status</div><Badge variant="outline" className={`mt-2 ${statusColors[student.status] || ""}`}>{student.status}</Badge></div>
      <div className="border-b border-border p-4 sm:border-b-0 sm:border-r"><div className="text-xs text-muted-foreground">Telefone</div><div className="mt-2 text-sm font-medium">{student.phone || "—"}</div></div>
      <div className="border-b border-border p-4 sm:border-b-0 sm:border-r"><div className="text-xs text-muted-foreground">Acessos ativos</div><div className="workspace-title mt-2 text-lg font-semibold">{activeEnrollments}</div></div>
      <div className="p-4"><div className="text-xs text-muted-foreground">Cadastro</div><div className="mt-2 text-sm font-medium">{formatDate(student.created_at)}</div></div>
    </div>

    <Tabs value={currentTab} onValueChange={changeTab}>
      <TabsList className="h-auto w-full justify-start gap-5 rounded-none border-b border-border bg-transparent p-0">
        <TabsTrigger value="access" className="rounded-none border-b-2 border-transparent px-0 py-3 shadow-none data-[state=active]:border-workspace-accent data-[state=active]:text-workspace-accent data-[state=active]:shadow-none">Acessos e produtos</TabsTrigger>
        <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent px-0 py-3 shadow-none data-[state=active]:border-workspace-accent data-[state=active]:text-workspace-accent data-[state=active]:shadow-none">Dados do aluno</TabsTrigger>
        <TabsTrigger value="payments" className="rounded-none border-b-2 border-transparent px-0 py-3 shadow-none data-[state=active]:border-workspace-accent data-[state=active]:text-workspace-accent data-[state=active]:shadow-none">Pagamentos</TabsTrigger>
      </TabsList>
      <TabsContent value="access" className="mt-5"><StudentAccessManager studentId={student.id} initialProductId={searchParams.get("product")} onChanged={fetchSummary} /></TabsContent>
      <TabsContent value="profile" className="mt-5"><section className="overflow-hidden rounded-lg border border-border bg-card"><div className="border-b border-border p-5"><h2 className="workspace-title text-lg font-semibold">Dados do aluno</h2><p className="mt-1 text-sm text-muted-foreground">Informações pessoais e situação do cadastro.</p></div><div className="grid gap-5 p-5 sm:grid-cols-2"><div className="space-y-2"><Label>Nome *</Label><Input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} /></div><div className="space-y-2"><Label>E-mail *</Label><Input type="email" value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} /></div><div className="space-y-2"><Label>Telefone</Label><Input value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} /></div><div className="space-y-2"><Label>CPF</Label><Input value={profile.cpf} onChange={(event) => setProfile((current) => ({ ...current, cpf: event.target.value }))} /></div><div className="space-y-2"><Label>Origem</Label><Input value={profile.origin} onChange={(event) => setProfile((current) => ({ ...current, origin: event.target.value }))} /></div><div className="space-y-2"><Label>Status</Label><Select value={profile.status} onValueChange={(value) => setProfile((current) => ({ ...current, status: value as Student["status"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="blocked">Bloqueado</SelectItem><SelectItem value="pending">Pendente</SelectItem><SelectItem value="canceled">Cancelado</SelectItem></SelectContent></Select></div></div><div className="flex justify-end border-t border-border p-4"><Button onClick={saveProfile} disabled={savingProfile}>{savingProfile ? "Salvando..." : "Salvar dados"}</Button></div></section></TabsContent>
      <TabsContent value="payments" className="mt-5"><section className="overflow-hidden rounded-lg border border-border bg-card"><div className="border-b border-border p-5"><h2 className="workspace-title text-lg font-semibold">Histórico de pagamentos</h2><p className="mt-1 text-sm text-muted-foreground">{payments.length} registros</p></div>{payments.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhum pagamento</p> : <div>{payments.map((payment) => <div key={payment.id} className="flex items-center justify-between gap-4 border-b border-border px-5 py-3 last:border-0"><div><div className="text-sm font-medium">{payment.product_name || payment.courses?.title || "—"}</div><div className="text-xs text-muted-foreground">{formatCurrency(Number(payment.amount))} · {payment.payment_method || "—"} · {formatDate(payment.purchased_at)}</div></div><Badge variant="outline" className={statusColors[payment.status] || ""}>{payment.status}</Badge></div>)}</div>}</section></TabsContent>
    </Tabs>
  </div>;
}
