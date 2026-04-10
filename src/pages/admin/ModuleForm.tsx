import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Lesson = Tables<"lessons">;

const typeLabel: Record<string, string> = { video: "Vídeo", text: "Texto", audio: "Áudio", download: "Download", hybrid: "Híbrido" };

export default function ModuleForm() {
  const { courseId, id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [courseName, setCourseName] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<TablesInsert<"course_modules">>({
    course_id: courseId || "",
    title: "",
    description: "",
    cover_url: "",
    sort_order: 0,
    status: "draft",
    release_type: "immediate",
    release_days: null,
    is_required: false,
  });

  const backUrl = `/admin/courses/${courseId}`;

  const fetchLessons = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("lessons")
      .select("*")
      .eq("module_id", id)
      .order("sort_order");
    setLessons(data ?? []);
  };

  useEffect(() => {
    // Fetch course name for breadcrumb
    if (courseId) {
      supabase.from("courses").select("title").eq("id", courseId).single().then(({ data }) => {
        setCourseName(data?.title || "");
      });
    }

    if (id) {
      setLoading(true);
      supabase.from("course_modules").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error || !data) { toast.error("Módulo não encontrado"); navigate(backUrl); }
        else setForm(data as unknown as TablesInsert<"course_modules">);
        setLoading(false);
      });
      fetchLessons();
    }
  }, [id, courseId, navigate]);

  const update = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    const payload = { ...form, course_id: courseId! };
    if (isEdit) {
      const { error } = await supabase.from("course_modules").update(payload).eq("id", id!);
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Módulo atualizado"); navigate(backUrl); }
    } else {
      const { error } = await supabase.from("course_modules").insert(payload);
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Módulo criado"); navigate(backUrl); }
    }
    setSaving(false);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Excluir esta aula?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (error) toast.error("Erro ao excluir aula");
    else { toast.success("Aula excluída"); fetchLessons(); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <p className="text-xs text-muted-foreground">{courseName}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar Módulo" : "Novo Módulo"}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Informações</h2>

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
          <Button type="button" variant="outline" onClick={() => navigate(backUrl)}>Cancelar</Button>
        </div>
      </form>

      {/* Lessons list - only when editing */}
      {isEdit && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Aulas</h2>
            <Link to={`/admin/courses/${courseId}/modules/${id}/lessons/new`}>
              <Button size="sm" variant="outline" className="gap-2 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" /> Nova Aula
              </Button>
            </Link>
          </div>

          {lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma aula cadastrada neste módulo</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Ordem</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Título</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Tipo</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                      <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{l.sort_order}</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{l.title}</td>
                      <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs font-mono">{typeLabel[l.lesson_type] || l.lesson_type}</Badge></td>
                      <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs">{l.status}</Badge></td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Link to={`/admin/courses/${courseId}/modules/${id}/lessons/${l.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteLesson(l.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
