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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Edit, Trash2, LayoutGrid, List, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import CoverUpload from "@/components/CoverUpload";

type CourseInsert = TablesInsert<"courses">;
type Module = Tables<"course_modules">;

function SortableModuleRow({
  module: m,
  courseId,
  onDelete,
}: {
  module: Module;
  courseId: string;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: m.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors bg-background">
      <td className="px-2 py-2.5 w-8">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none">
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-4 py-2.5 font-medium text-foreground">{m.title}</td>
      <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs">{m.status}</Badge></td>
      <td className="px-4 py-2.5 text-muted-foreground text-xs font-mono">{m.release_type}{m.release_days ? ` (${m.release_days}d)` : ""}</td>
      <td className="px-4 py-2.5">
        <div className="flex justify-end gap-1">
          <Link to={`/admin/courses/${courseId}/modules/${m.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(m.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function CourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesView, setModulesView] = useState<"list" | "grid">("grid");

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

  const fetchModules = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", id)
      .order("sort_order");
    setModules(data ?? []);
  };

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
      fetchModules();
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

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Excluir este módulo e todas as suas aulas?")) return;
    const { error } = await supabase.from("course_modules").delete().eq("id", moduleId);
    if (error) toast.error("Erro ao excluir módulo");
    else { toast.success("Módulo excluído"); fetchModules(); }
  };

  const moduleSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIndex, newIndex);
    setModules(reordered);
    const updates = reordered.map((m, i) =>
      supabase.from("course_modules").update({ sort_order: i }).eq("id", m.id)
    );
    const results = await Promise.all(updates);
    if (results.some((r) => r.error)) {
      toast.error("Erro ao salvar ordem");
      fetchModules();
    } else {
      toast.success("Ordem atualizada");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/courses")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar Produto" : "Novo Produto"}</h1>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/courses")}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : isEdit ? "Salvar Alterações" : "Criar Produto"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
            Informações Básicas
          </TabsTrigger>
          <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
            Mídia
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
            Configurações
          </TabsTrigger>
          {isEdit && (
            <TabsTrigger value="modules" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
              Módulos
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <div className="grid grid-cols-[380px_1fr] gap-8">
            <CoverUpload
              value={form.cover_url || ""}
              onChange={(url) => update("cover_url", url)}
              storagePath={`covers/courses/${id || "new"}`}
              label="Capa do Produto"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium">Título *</Label>
                  <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className="bg-background border-border" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium">Slug *</Label>
                  <Input value={form.slug} onChange={(e) => update("slug", e.target.value)} className="bg-background border-border font-mono text-xs" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Descrição curta</Label>
                <Textarea value={form.short_description || ""} onChange={(e) => update("short_description", e.target.value)} className="bg-background border-border" rows={2} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Descrição completa</Label>
                <Textarea value={form.full_description || ""} onChange={(e) => update("full_description", e.target.value)} className="bg-background border-border" rows={5} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium">Categoria</Label>
                  <Input value={form.category || ""} onChange={(e) => update("category", e.target.value)} className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium">Instrutor</Label>
                  <Input value={form.instructor_name || ""} onChange={(e) => update("instructor_name", e.target.value)} className="bg-background border-border" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <CoverUpload
              value={form.banner_url || ""}
              onChange={(url) => update("banner_url", url)}
              storagePath={`banners/courses/${id || "new"}`}
              label="Banner"
              aspectRatio="aspect-[16/9]"
              hint="Dimensões ideais: 1920×1080 pixels. Tamanho máximo: 10 MB."
            />
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">URL do Trailer (Vimeo)</Label>
              <Input value={form.trailer_url || ""} onChange={(e) => update("trailer_url", e.target.value)} placeholder="https://vimeo.com/..." className="bg-background border-border" />
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
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Tipo de Acesso</Label>
              <Select value={form.access_type || "lifetime"} onValueChange={(v) => update("access_type", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lifetime">Vitalício</SelectItem>
                  <SelectItem value="limited">Limitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.access_type === "limited" && (
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Dias de Acesso</Label>
                <Input type="number" value={form.access_days ?? ""} onChange={(e) => update("access_days", e.target.value ? Number(e.target.value) : null)} className="bg-background border-border" />
              </div>
            )}

            <div className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border border-border p-5">
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Destaque</Label>
                <Switch checked={form.featured ?? false} onCheckedChange={(v) => update("featured", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Gratuito</Label>
                <Switch checked={form.is_free ?? false} onCheckedChange={(v) => update("is_free", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Permitir Comentários</Label>
                <Switch checked={form.allow_comments ?? true} onCheckedChange={(v) => update("allow_comments", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Certificado</Label>
                <Switch checked={form.has_certificate ?? false} onCheckedChange={(v) => update("has_certificate", v)} />
              </div>
            </div>
          </div>
        </TabsContent>


        {isEdit && (
          <TabsContent value="modules" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-muted-foreground">Arraste para reordenar os módulos</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
                  <Button variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${modulesView === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setModulesView("list")}>
                    <List className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className={`h-7 w-7 rounded-md ${modulesView === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setModulesView("grid")}>
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Link to={`/admin/courses/${id}/modules/new`}>
                  <Button size="sm" variant="outline" className="gap-2 h-8 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Novo Módulo
                  </Button>
                </Link>
              </div>
            </div>

            {modules.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <p className="text-sm text-muted-foreground">Nenhum módulo cadastrado neste produto</p>
              </div>
            ) : modulesView === "list" ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <DndContext sensors={moduleSensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="w-8 px-2 py-2.5" />
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Título</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Liberação</th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Ações</th>
                      </tr>
                    </thead>
                    <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {modules.map((m) => (
                          <SortableModuleRow key={m.id} module={m} courseId={id!} onDelete={handleDeleteModule} />
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {modules.map((m) => (
                  <div key={m.id} className="group rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-muted-foreground/30">
                    <Link to={`/admin/courses/${id}/modules/${m.id}`}>
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {m.cover_url ? (
                          <img src={m.cover_url} alt={m.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                            <LayoutGrid className="h-10 w-10" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4 space-y-2">
                      <Link to={`/admin/courses/${id}/modules/${m.id}`}>
                        <h3 className="font-medium text-foreground text-sm leading-tight group-hover:underline">{m.title}</h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[11px]">{m.status}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteModule(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{m.release_type}{m.release_days ? ` (${m.release_days}d)` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
