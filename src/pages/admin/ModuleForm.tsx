import { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
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
import { ArrowLeft, Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import CoverUpload from "@/components/CoverUpload";
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

type Lesson = Tables<"lessons">;

const typeLabel: Record<string, string> = { video: "Vídeo", text: "Texto", audio: "Áudio", download: "Download", hybrid: "Híbrido" };

function SortableLessonRow({
  lesson,
  courseId,
  moduleId,
  onDelete,
}: {
  lesson: Lesson;
  courseId: string;
  moduleId: string;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors bg-background">
      <td className="px-2 py-2.5 w-8">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none">
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-4 py-2.5 font-medium text-foreground">{lesson.title}</td>
      <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs font-mono">{typeLabel[lesson.lesson_type] || lesson.lesson_type}</Badge></td>
      <td className="px-4 py-2.5"><Badge variant="outline" className="text-xs">{lesson.status}</Badge></td>
      <td className="px-4 py-2.5">
        <div className="flex justify-end gap-1">
          <Link to={`/admin/courses/${courseId}/modules/${moduleId}/lessons/${lesson.id}`}>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(lesson.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function ModuleForm() {
  const { courseId, id } = useParams();
  const [searchParams] = useSearchParams();
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(lessons, oldIndex, newIndex);

    setLessons(reordered);

    const updates = reordered.map((l, i) =>
      supabase.from("lessons").update({ sort_order: i }).eq("id", l.id)
    );
    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);
    if (hasError) {
      toast.error("Erro ao salvar ordem");
      fetchLessons();
    } else {
      toast.success("Ordem atualizada");
    }
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
            <p className="text-xs text-muted-foreground">{courseName}</p>
            <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar Módulo" : "Novo Módulo"}</h1>
          </div>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(backUrl)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : isEdit ? "Salvar" : "Criar Módulo"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue={searchParams.get("tab") || "info"} className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
            Informações
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
            Configurações
          </TabsTrigger>
          {isEdit && (
            <TabsTrigger value="lessons" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-[13px]">
              Aulas
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-[380px_1fr] gap-8">
            <CoverUpload
              value={form.cover_url || ""}
              onChange={(url) => update("cover_url", url)}
              storagePath={`covers/modules/${courseId}/${id || "new"}`}
            />
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Título *</Label>
                <Input value={form.title} onChange={(e) => update("title", e.target.value)} className="bg-background border-border" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Descrição</Label>
                <Textarea value={form.description || ""} onChange={(e) => update("description", e.target.value)} className="bg-background border-border" rows={6} />
              </div>
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
              <Label className="text-[13px] font-medium">Tipo de Liberação</Label>
              <Select value={form.release_type || "immediate"} onValueChange={(v) => update("release_type", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Imediata</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="drip">Drip (dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.release_type === "drip" && (
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Dias para Liberar</Label>
                <Input type="number" value={form.release_days ?? ""} onChange={(e) => update("release_days", e.target.value ? Number(e.target.value) : null)} className="bg-background border-border" />
              </div>
            )}
            <div className="col-span-2 rounded-lg border border-border p-5">
              <div className="flex items-center justify-between">
                <Label className="text-[13px]">Módulo Obrigatório</Label>
                <Switch checked={form.is_required ?? false} onCheckedChange={(v) => update("is_required", v)} />
              </div>
            </div>
          </div>
        </TabsContent>

        {isEdit && (
          <TabsContent value="lessons" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-muted-foreground">Arraste para reordenar as aulas</p>
              <Link to={`/admin/courses/${courseId}/modules/${id}/lessons/new`}>
                <Button size="sm" variant="outline" className="gap-2 h-8 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Nova Aula
                </Button>
              </Link>
            </div>

            {lessons.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-12 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma aula cadastrada neste módulo</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="w-8 px-2 py-2.5" />
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Título</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Tipo</th>
                        <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                        <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs">Ações</th>
                      </tr>
                    </thead>
                    <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {lessons.map((l) => (
                          <SortableLessonRow
                            key={l.id}
                            lesson={l}
                            courseId={courseId!}
                            moduleId={id!}
                            onDelete={handleDeleteLesson}
                          />
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
