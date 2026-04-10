import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, BookOpen, CreditCard, GraduationCap } from "lucide-react";
import { toast } from "sonner";

type Student = Tables<"students">;
type Enrollment = Tables<"enrollments"> & { courses?: { title: string } | null };
type Payment = Tables<"payments"> & { courses?: { title: string } | null };

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  blocked: "bg-red-500/10 text-red-400 border-red-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  canceled: "bg-muted text-muted-foreground",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  refunded: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  chargeback: "bg-red-500/10 text-red-400 border-red-500/20",
  expired: "bg-muted text-muted-foreground",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from("students").select("*").eq("id", id).single(),
      supabase.from("enrollments").select("*, courses(title)").eq("student_id", id).order("created_at", { ascending: false }),
      supabase.from("payments").select("*, courses(title)").eq("student_id", id).order("created_at", { ascending: false }),
    ]).then(([sRes, eRes, pRes]) => {
      if (sRes.error || !sRes.data) { toast.error("Aluno não encontrado"); navigate("/admin/students"); return; }
      setStudent(sRes.data);
      setEnrollments((eRes.data as Enrollment[]) ?? []);
      setPayments((pRes.data as Payment[]) ?? []);
      setLoading(false);
    });
  }, [id, navigate]);

  if (loading || !student) return <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";
  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/students")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{student.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{student.email}</p>
          </div>
        </div>
        <Link to={`/admin/students/${id}`}><Button variant="outline" size="sm" className="gap-2"><Edit className="h-3.5 w-3.5" /> Editar</Button></Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <Badge variant="outline" className={statusColors[student.status] || ""}>{student.status}</Badge>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-muted-foreground mb-1">Telefone</div>
            <div className="text-sm font-medium">{student.phone || "—"}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-muted-foreground mb-1">CPF</div>
            <div className="text-sm font-medium font-mono">{student.cpf || "—"}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="text-xs text-muted-foreground mb-1">Cadastro</div>
            <div className="text-sm font-medium">{formatDate(student.created_at)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Matrículas ({enrollments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma matrícula</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium">{e.courses?.title || "Curso removido"}</div>
                    <div className="text-xs text-muted-foreground">Origem: {e.origin} • Início: {formatDate(e.started_at)}{e.expires_at ? ` • Expira: ${formatDate(e.expires_at)}` : ""}</div>
                  </div>
                  <Badge variant="outline" className={statusColors[e.status] || ""}>{e.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pagamentos ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium">{p.product_name || p.courses?.title || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(Number(p.amount))} • {p.payment_method || "—"} • {formatDate(p.purchased_at)}
                    </div>
                  </div>
                  <Badge variant="outline" className={statusColors[p.status] || ""}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
