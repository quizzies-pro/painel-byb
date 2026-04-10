import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const slugify = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function LessonForm() {
  const { courseId, moduleId, id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [courseName, setCourseName] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<TablesInsert<"lessons">>({
    course_id: courseId || "",
    module_id: moduleId || "",
    title: "",
    slug: "",
    short_description: "",
    content_html: "",
    lesson_type: "video",
    video_url: "",
    audio_url: "",
    thumbnail_url: "",
    duration_seconds: null,
    is_preview: false,
    is_required: false,
    allow_comments: true,
    allow_download: false,
    status: "draft",
    release_type: "immediate",
    release_days: null,
    sort_order: 0,
    tags: [],
    author: "",
    estimated_time: "",
  });

  const backUrl = `/admin/courses/${courseId}/modules/${moduleId}`;

  useEffect(() => {
    // Fetch names for breadcrumb
    if (courseId) {
      supabase.from("courses").select("title").eq("id", courseId).single().then(({ data }) => setCourseName(data?.title || ""));
    }
    if (moduleId) {
      supabase.from("course_modules").select("title").eq("id", moduleId).single().then(({ data }) => setModuleName(data?.title || ""));
    }

    if (id) {
      setLoading(true);
      supabase.from("lessons").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error || !data) { toast.error("Aula não encontrada"); navigate(backUrl); }
        else setForm(data as unknown as TablesInsert<"lessons">);
        setLoading(false);
      });
    }
  }, [id, courseId, moduleId, navigate]);

  const update = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const handleTitleChange = (title: string) => {
    update("title", title);
    if (!isEdit) update("slug", slugify(title));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) {
      toast.error("Título e slug são obrigatórios");
      return;
    }
    setSaving(true);
    const payload = { ...form, course_id: courseId!, module_id: moduleId! };
    if (isEdit) {
      const { error } = await supabase.from("lessons").update(payload).eq("id", id!);
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Aula atualizada"); navigate(backUrl); }
    } else {
      const { error } = await supabase.from("lessons").insert(payload);
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Aula criada"); navigate(backUrl); }
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <p className="text-xs text-muted-foreground">{courseName} → {moduleName}</p>
          <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar Aula" : "Nova Aula"}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Informações</h2>
          <div className="space-y-2">
            <Label className="text-sm">Título *</Label>
            <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className="bg-card border-border" required />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Slug *</Label>
            <Input value={form.slug} onChange={(e) => update("slug", e.target.value)} className="bg-card border-border font-mono text-xs" required />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Descrição curta</Label>
            <Textarea value={form.short_description || ""} onChange={(e) => update("short_description", e.target.value)} className="bg-card border-border" rows={2} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Conteúdo (HTML)</Label>
            <Textarea value={form.content_html || ""} onChange={(e) => update("content_html", e.target.value)} className="bg-card border-border font-mono text-xs" rows={6} />
          </div>
        </div>

        {/* Media */}
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Mídia</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Tipo de Aula</Label>
              <Select value={form.lesson_type || "video"} onValueChange={(v) => update("lesson_type", v)}>
                <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="audio">Áudio</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Duração (segundos)</Label>
              <Input type="number" value={form.duration_seconds ?? ""} onChange={(e) => update("duration_seconds", e.target.value ? Number(e.target.value) : null)} className="bg-card border-border" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">URL do Vídeo (Vimeo)</Label>
            <Input value={form.video_url || ""} onChange={(e) => update("video_url", e.target.value)} placeholder="https://vimeo.com/..." className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">URL do Áudio</Label>
            <Input value={form.audio_url || ""} onChange={(e) => update("audio_url", e.target.value)} className="bg-card border-border" />
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Configurações</h2>
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Preview (aula gratuita)</Label>
              <Switch checked={form.is_preview ?? false} onCheckedChange={(v) => update("is_preview", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Obrigatória</Label>
              <Switch checked={form.is_required ?? false} onCheckedChange={(v) => update("is_required", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Comentários</Label>
              <Switch checked={form.allow_comments ?? true} onCheckedChange={(v) => update("allow_comments", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Permitir Download</Label>
              <Switch checked={form.allow_download ?? false} onCheckedChange={(v) => update("allow_download", v)} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : isEdit ? "Salvar" : "Criar Aula"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(backUrl)}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
