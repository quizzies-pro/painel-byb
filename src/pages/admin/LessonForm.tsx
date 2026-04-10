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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(backUrl)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">{courseName} → {moduleName}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar Aula" : "Nova Aula"}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(backUrl)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : isEdit ? "Salvar" : "Criar Aula"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
            Informações
          </TabsTrigger>
          <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
            Mídia
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Título *</Label>
              <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className="bg-background border-border" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Slug *</Label>
              <Input value={form.slug} onChange={(e) => update("slug", e.target.value)} className="bg-background border-border font-mono text-xs" required />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-[13px] font-medium">Descrição curta</Label>
              <Textarea value={form.short_description || ""} onChange={(e) => update("short_description", e.target.value)} className="bg-background border-border" rows={2} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-[13px] font-medium">Conteúdo (HTML)</Label>
              <Textarea value={form.content_html || ""} onChange={(e) => update("content_html", e.target.value)} className="bg-background border-border font-mono text-xs" rows={8} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Tipo de Aula</Label>
              <Select value={form.lesson_type || "video"} onValueChange={(v) => update("lesson_type", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
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
              <Label className="text-[13px] font-medium">Duração (segundos)</Label>
              <Input type="number" value={form.duration_seconds ?? ""} onChange={(e) => update("duration_seconds", e.target.value ? Number(e.target.value) : null)} className="bg-background border-border" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-[13px] font-medium">URL do Vídeo (Vimeo)</Label>
              <Input value={form.video_url || ""} onChange={(e) => update("video_url", e.target.value)} placeholder="https://vimeo.com/..." className="bg-background border-border" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-[13px] font-medium">URL do Áudio</Label>
              <Input value={form.audio_url || ""} onChange={(e) => update("audio_url", e.target.value)} className="bg-background border-border" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-[13px] font-medium">URL da Thumbnail</Label>
              <Input value={form.thumbnail_url || ""} onChange={(e) => update("thumbnail_url", e.target.value)} placeholder="https://..." className="bg-background border-border" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Status</Label>
              <Select value={form.status || "draft"} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="hidden">Oculto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Ordem</Label>
              <Input type="number" value={form.sort_order ?? 0} onChange={(e) => update("sort_order", Number(e.target.value))} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Autor</Label>
              <Input value={form.author || ""} onChange={(e) => update("author", e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Tempo Estimado</Label>
              <Input value={form.estimated_time || ""} onChange={(e) => update("estimated_time", e.target.value)} placeholder="ex: 15min" className="bg-background border-border" />
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-border p-5">
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Preview (aula gratuita)</Label>
                <Switch checked={form.is_preview ?? false} onCheckedChange={(v) => update("is_preview", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Obrigatória</Label>
                <Switch checked={form.is_required ?? false} onCheckedChange={(v) => update("is_required", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Comentários</Label>
                <Switch checked={form.allow_comments ?? true} onCheckedChange={(v) => update("allow_comments", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Permitir Download</Label>
                <Switch checked={form.allow_download ?? false} onCheckedChange={(v) => update("allow_download", v)} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
