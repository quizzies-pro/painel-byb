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

type CourseInsert = TablesInsert<"courses">;

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function CourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CourseInsert>({
    title: "",
    slug: "",
    short_description: "",
    full_description: "",
    cover_url: "",
    banner_url: "",
    trailer_url: "",
    category: "",
    instructor_name: "",
    status: "draft",
    featured: false,
    access_type: "lifetime",
    access_days: null,
    ticto_product_id: "",
    tags: [],
    allow_comments: true,
    has_certificate: false,
    is_free: false,
    language: "pt-BR",
    seo_title: "",
    seo_description: "",
    display_order: 0,
  });

  useEffect(() => {
    if (id) {
      setLoading(true);
      supabase.from("courses").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error || !data) {
          toast.error("Produto não encontrado");
          navigate("/admin/courses");
        } else {
          setForm(data as unknown as CourseInsert);
        }
        setLoading(false);
      });
    }
  }, [id, navigate]);

  const update = (key: keyof CourseInsert, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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

    if (isEdit) {
      const { error } = await supabase.from("courses").update(form).eq("id", id!);
      if (error) toast.error("Erro ao atualizar produto: " + error.message);
      else { toast.success("Produto atualizado"); navigate("/admin/courses"); }
    } else {
      const { error } = await supabase.from("courses").insert(form);
      if (error) toast.error("Erro ao criar produto: " + error.message);
      else { toast.success("Produto criado"); navigate("/admin/courses"); }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/courses")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar Produto" : "Novo Produto"}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Informações Básicas</h2>
          
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
            <Label className="text-sm">Descrição completa</Label>
            <Textarea value={form.full_description || ""} onChange={(e) => update("full_description", e.target.value)} className="bg-card border-border" rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Categoria</Label>
              <Input value={form.category || ""} onChange={(e) => update("category", e.target.value)} className="bg-card border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Instrutor</Label>
              <Input value={form.instructor_name || ""} onChange={(e) => update("instructor_name", e.target.value)} className="bg-card border-border" />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Mídia</h2>
          <div className="space-y-2">
            <Label className="text-sm">URL da Capa</Label>
            <Input value={form.cover_url || ""} onChange={(e) => update("cover_url", e.target.value)} placeholder="https://..." className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">URL do Banner</Label>
            <Input value={form.banner_url || ""} onChange={(e) => update("banner_url", e.target.value)} placeholder="https://..." className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">URL do Trailer (Vimeo)</Label>
            <Input value={form.trailer_url || ""} onChange={(e) => update("trailer_url", e.target.value)} placeholder="https://vimeo.com/..." className="bg-card border-border" />
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
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Tipo de Acesso</Label>
              <Select value={form.access_type || "lifetime"} onValueChange={(v) => update("access_type", v)}>
                <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lifetime">Vitalício</SelectItem>
                  <SelectItem value="limited">Limitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.access_type === "limited" && (
            <div className="space-y-2">
              <Label className="text-sm">Dias de Acesso</Label>
              <Input type="number" value={form.access_days ?? ""} onChange={(e) => update("access_days", e.target.value ? Number(e.target.value) : null)} className="bg-card border-border" />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Destaque</Label>
              <Switch checked={form.featured ?? false} onCheckedChange={(v) => update("featured", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Gratuito</Label>
              <Switch checked={form.is_free ?? false} onCheckedChange={(v) => update("is_free", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Permitir Comentários</Label>
              <Switch checked={form.allow_comments ?? true} onCheckedChange={(v) => update("allow_comments", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Certificado</Label>
              <Switch checked={form.has_certificate ?? false} onCheckedChange={(v) => update("has_certificate", v)} />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">SEO</h2>
          <div className="space-y-2">
            <Label className="text-sm">Título SEO</Label>
            <Input value={form.seo_title || ""} onChange={(e) => update("seo_title", e.target.value)} className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Descrição SEO</Label>
            <Textarea value={form.seo_description || ""} onChange={(e) => update("seo_description", e.target.value)} className="bg-card border-border" rows={2} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : isEdit ? "Salvar Alterações" : "Criar Produto"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/courses")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
