import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type StudentOption = Pick<Tables<"students">, "id" | "name" | "email">;
type CourseOption = Pick<Tables<"courses">, "id" | "title">;

export default function EnrollmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<TablesInsert<"enrollments">>({
    student_id: "",
    course_id: "",
    origin: "manual",
    status: "active",
    started_at: new Date().toISOString(),
    expires_at: undefined,
    created_by: undefined,
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("students").select("id, name, email").order("name"),
      supabase.from("courses").select("id, title").order("title"),
    ]).then(([sRes, cRes]) => {
      setStudents(sRes.data ?? []);
      setCourses(cRes.data ?? []);
    });

    if (id) {
      setLoading(true);
      supabase.from("enrollments").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error || !data) { toast.error("Matrícula não encontrada"); navigate("/admin/enrollments"); }
        else setForm(data as unknown as TablesInsert<"enrollments">);
        setLoading(false);
      });
    }
  }, [id, navigate]);

  const update = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.course_id) { toast.error("Aluno e produto são obrigatórios"); return; }
    setSaving(true);
    const payload = { ...form, created_by: user?.id };
    if (isEdit) {
      const { error } = await supabase.from("enrollments").update(payload).eq("id", id!);
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Matrícula atualizada"); navigate("/admin/enrollments"); }
    } else {
      const { error } = await supabase.from("enrollments").insert(payload);
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Matrícula criada"); navigate("/admin/enrollments"); }
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/enrollments")}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar Matrícula" : "Nova Matrícula"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dados da Matrícula</h2>

          <div className="space-y-2">
            <Label className="text-sm">Aluno *</Label>
            <Select value={form.student_id} onValueChange={(v) => update("student_id", v)}>
              <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Selecione um aluno" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.email})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
             <Label className="text-sm">Produto *</Label>
            <Select value={form.course_id} onValueChange={(v) => update("course_id", v)}>
              <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Origem</Label>
              <Select value={form.origin || "manual"} onValueChange={(v) => update("origin", v)}>
                <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Compra</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="bonus">Bônus</SelectItem>
                  <SelectItem value="test">Teste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <Select value={form.status || "active"} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                  <SelectItem value="canceled">Cancelada</SelectItem>
                  <SelectItem value="blocked">Bloqueada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Data de Expiração (opcional)</Label>
            <Input type="date" value={form.expires_at ? new Date(form.expires_at).toISOString().split("T")[0] : ""} onChange={(e) => update("expires_at", e.target.value ? new Date(e.target.value).toISOString() : null)} className="bg-card border-border" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Observações</Label>
            <Textarea value={form.notes || ""} onChange={(e) => update("notes", e.target.value)} className="bg-card border-border" rows={3} placeholder="Notas internas sobre esta matrícula..." />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : isEdit ? "Salvar" : "Criar Matrícula"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/enrollments")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
