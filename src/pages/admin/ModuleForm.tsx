import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type CourseOption = Pick<Tables<"courses">, "id" | "title">;

export default function ModuleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<TablesInsert<"course_modules">>({
    course_id: "",
    title: "",
    description: "",
    cover_url: "",
    sort_order: 0,
    status: "draft",
    release_type: "immediate",
    release_days: null,
    is_required: false,
  });

  useEffect(() => {
    supabase.from("courses").select("id, title").order("title").then(({ data }) => setCourses(data ?? []));
    if (id) {
      setLoading(true);
      supabase.from("course_modules").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error || !data) { toast.error("Módulo não encontrado"); navigate("/admin/modules"); }
        else setForm(data as unknown as TablesInsert<"course_modules">);
        setLoading(false);
      });
    }
  }, [id, navigate]);

  const update = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_id || !form.title) { toast.error("Produto e título são obrigatórios"); return; }
    setSaving(true);
    if (isEdit) {
      const { error } = await supabase.from("course_modules").update(form).eq("id", id!);
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Módulo atualizado"); navigate("/admin/modules"); }
    } else {
      const { error } = await supabase.from("course_modules").insert(form);
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Módulo criado"); navigate("/admin/modules"); }
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/modules")}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar Módulo" : "Novo Módulo"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Informações</h2>

          <div className="space-y-2">
             <Label className="text-sm">Produto *</Label>
            <Select value={form.course_id} onValueChange={(v) => update("course_id", v)}>
              <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Título *</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} className="bg-card border-border" required />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Descrição</Label>
            <Textarea value={form.description || ""} onChange={(e) => update("description", e.target.value)} className="bg-card border-border" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <Select value={form.status || "draft"} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="hidden">Oculto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Ordem</Label>
              <Input type="number" value={form.sort_order ?? 0} onChange={(e) => update("sort_order", Number(e.target.value))} className="bg-card border-border" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Tipo de Liberação</Label>
              <Select value={form.release_type || "immediate"} onValueChange={(v) => update("release_type", v)}>
                <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Imediata</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="drip">Drip (dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.release_type === "drip" && (
              <div className="space-y-2">
                <Label className="text-sm">Dias para Liberar</Label>
                <Input type="number" value={form.release_days ?? ""} onChange={(e) => update("release_days", e.target.value ? Number(e.target.value) : null)} className="bg-card border-border" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Módulo Obrigatório</Label>
            <Switch checked={form.is_required ?? false} onCheckedChange={(v) => update("is_required", v)} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : isEdit ? "Salvar" : "Criar Módulo"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/modules")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
