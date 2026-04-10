import { useEffect, useState, useRef } from "react";
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
import { ArrowLeft, Upload, FileText, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const slugify = (t: string) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

interface Material {
  id: string;
  title: string;
  file_url: string | null;
  cover_url: string | null;
  material_type: string;
  sort_order: number;
}

export default function LessonForm() {
  const { courseId, moduleId, id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [courseName, setCourseName] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingCover, setUploadingCover] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const coverInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  const fetchMaterials = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("lesson_materials")
      .select("id, title, file_url, cover_url, material_type, sort_order")
      .eq("lesson_id", id)
      .eq("material_type", "pdf")
      .order("sort_order");
    setMaterials(data ?? []);
  };

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
      fetchMaterials();
    }
  }, [id, courseId, moduleId, navigate]);

  const update = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const handleTitleChange = (title: string) => {
    update("title", title);
    if (!isEdit) update("slug", slugify(title));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são permitidos");
      return;
    }

    setUploadingPdf(true);
    const filePath = `${courseId}/${moduleId}/${id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro ao enviar PDF: " + uploadError.message);
      setUploadingPdf(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("materials").getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("lesson_materials").insert({
      lesson_id: id,
      course_id: courseId!,
      module_id: moduleId!,
      title: file.name.replace(".pdf", ""),
      file_url: urlData.publicUrl,
      material_type: "pdf" as const,
      sort_order: materials.length,
    });

    if (insertError) {
      toast.error("Erro ao salvar material: " + insertError.message);
    } else {
      toast.success("PDF adicionado");
      fetchMaterials();
    }
    setUploadingPdf(false);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const handleCoverUpload = async (materialId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Apenas imagens são permitidas para capa");
      return;
    }

    setUploadingCover(materialId);
    const filePath = `covers/${courseId}/${moduleId}/${id}/${materialId}_${Date.now()}.${file.name.split(".").pop()}`;

    const { error: uploadError } = await supabase.storage
      .from("materials")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro ao enviar capa: " + uploadError.message);
      setUploadingCover(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("materials").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("lesson_materials")
      .update({ cover_url: urlData.publicUrl } as any)
      .eq("id", materialId);

    if (updateError) {
      toast.error("Erro ao salvar capa: " + updateError.message);
    } else {
      toast.success("Capa adicionada");
      fetchMaterials();
    }
    setUploadingCover(null);
  };

  const handleDeleteMaterial = async (materialId: string, fileUrl: string | null) => {
    if (!confirm("Excluir este material?")) return;

    if (fileUrl) {
      const path = fileUrl.split("/materials/")[1];
      if (path) await supabase.storage.from("materials").remove([path]);
    }

    const { error } = await supabase.from("lesson_materials").delete().eq("id", materialId);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Material excluído"); fetchMaterials(); }
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
          <Button onClick={() => handleSubmit()} disabled={saving}>
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
          {isEdit && (
            <TabsTrigger value="materials" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
              Materiais
            </TabsTrigger>
          )}
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

        {isEdit && (
          <TabsContent value="materials" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-medium">Materiais PDF</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Faça upload de PDFs e adicione capas para cada material</p>
                </div>
                <div>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handlePdfUpload}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2 h-8 text-xs"
                    disabled={uploadingPdf}
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    {uploadingPdf ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Enviar PDF
                  </Button>
                </div>
              </div>

              {materials.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-12 text-center">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum material cadastrado</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Clique em "Enviar PDF" para adicionar</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {materials.map((mat) => (
                    <div key={mat.id} className="rounded-lg border border-border overflow-hidden group">
                      {/* Cover area */}
                      <div className="relative aspect-[16/10] bg-muted/30 flex items-center justify-center">
                        {mat.cover_url ? (
                          <img
                            src={mat.cover_url}
                            alt={mat.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 text-muted-foreground/40">
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-[11px]">Sem capa</span>
                          </div>
                        )}
                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={(el) => { coverInputRefs.current[mat.id] = el; }}
                            onChange={(e) => handleCoverUpload(mat.id, e)}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs gap-1.5"
                            disabled={uploadingCover === mat.id}
                            onClick={() => coverInputRefs.current[mat.id]?.click()}
                          >
                            {uploadingCover === mat.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                            ) : (
                              <ImageIcon className="h-3 w-3" />
                            )}
                            {mat.cover_url ? "Trocar Capa" : "Adicionar Capa"}
                          </Button>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-[13px] font-medium truncate">{mat.title}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleDeleteMaterial(mat.id, mat.file_url)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}

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
