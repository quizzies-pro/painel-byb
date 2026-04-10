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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type StudentOption = Pick<Tables<"students">, "id" | "name" | "email">;
type CourseOption = Pick<Tables<"courses">, "id" | "title">;
type Module = Tables<"course_modules">;
type Lesson = Tables<"lessons">;

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export default function EnrollmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [modulesWithLessons, setModulesWithLessons] = useState<ModuleWithLessons[]>([]);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [accessMode, setAccessMode] = useState<"full" | "custom">("full");

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
      supabase.from("enrollments").select("*").eq("id", id).single().then(async ({ data, error }) => {
        if (error || !data) { toast.error("Matrícula não encontrada"); navigate("/admin/enrollments"); return; }
        setForm(data as unknown as TablesInsert<"enrollments">);

        // Load existing granular access
        const [mRes, lRes] = await Promise.all([
          supabase.from("enrollment_modules").select("module_id").eq("enrollment_id", id),
          supabase.from("enrollment_lessons").select("lesson_id").eq("enrollment_id", id),
        ]);

        const mIds = new Set((mRes.data ?? []).map((r) => r.module_id));
        const lIds = new Set((lRes.data ?? []).map((r) => r.lesson_id));

        if (mIds.size > 0 || lIds.size > 0) {
          setAccessMode("custom");
          setSelectedModules(mIds);
          setSelectedLessons(lIds);
        }

        setLoading(false);
      });
    }
  }, [id, navigate]);

  // Load modules & lessons when course changes
  useEffect(() => {
    if (!form.course_id) { setModulesWithLessons([]); return; }

    Promise.all([
      supabase.from("course_modules").select("*").eq("course_id", form.course_id).order("sort_order"),
      supabase.from("lessons").select("*").eq("course_id", form.course_id).order("sort_order"),
    ]).then(([mRes, lRes]) => {
      const modules = mRes.data ?? [];
      const lessons = lRes.data ?? [];
      const grouped: ModuleWithLessons[] = modules.map((m) => ({
        ...m,
        lessons: lessons.filter((l) => l.module_id === m.id),
      }));
      setModulesWithLessons(grouped);
    });
  }, [form.course_id]);

  const update = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const toggleModule = (moduleId: string, lessons: Lesson[]) => {
    const next = new Set(selectedModules);
    const nextLessons = new Set(selectedLessons);

    if (next.has(moduleId)) {
      next.delete(moduleId);
      lessons.forEach((l) => nextLessons.delete(l.id));
    } else {
      next.add(moduleId);
      lessons.forEach((l) => nextLessons.add(l.id));
    }

    setSelectedModules(next);
    setSelectedLessons(nextLessons);
  };

  const toggleLesson = (lessonId: string, moduleId: string, moduleLessons: Lesson[]) => {
    const nextLessons = new Set(selectedLessons);

    if (nextLessons.has(lessonId)) {
      nextLessons.delete(lessonId);
    } else {
      nextLessons.add(lessonId);
    }

    // Auto-check module if all lessons selected, uncheck if none
    const nextModules = new Set(selectedModules);
    const allSelected = moduleLessons.every((l) => nextLessons.has(l.id));
    const noneSelected = moduleLessons.every((l) => !nextLessons.has(l.id));

    if (allSelected) nextModules.add(moduleId);
    else if (noneSelected) nextModules.delete(moduleId);
    else nextModules.add(moduleId); // partial = module still selected

    setSelectedModules(nextModules);
    setSelectedLessons(nextLessons);
  };

  const toggleExpand = (moduleId: string) => {
    const next = new Set(expandedModules);
    if (next.has(moduleId)) next.delete(moduleId);
    else next.add(moduleId);
    setExpandedModules(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.course_id) { toast.error("Aluno e produto são obrigatórios"); return; }
    setSaving(true);

    const payload = { ...form, created_by: user?.id };

    let enrollmentId = id;

    if (isEdit) {
      const { error } = await supabase.from("enrollments").update(payload).eq("id", id!);
      if (error) { toast.error("Erro: " + error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("enrollments").insert(payload).select("id").single();
      if (error || !data) { toast.error("Erro: " + (error?.message || "Erro desconhecido")); setSaving(false); return; }
      enrollmentId = data.id;
    }

    // Save granular access
    if (enrollmentId) {
      // Clear existing
      await Promise.all([
        supabase.from("enrollment_modules").delete().eq("enrollment_id", enrollmentId),
        supabase.from("enrollment_lessons").delete().eq("enrollment_id", enrollmentId),
      ]);

      if (accessMode === "custom" && (selectedModules.size > 0 || selectedLessons.size > 0)) {
        const moduleInserts = Array.from(selectedModules).map((module_id) => ({
          enrollment_id: enrollmentId!,
          module_id,
        }));
        const lessonInserts = Array.from(selectedLessons).map((lesson_id) => ({
          enrollment_id: enrollmentId!,
          lesson_id,
        }));

        if (moduleInserts.length > 0) {
          await supabase.from("enrollment_modules").insert(moduleInserts);
        }
        if (lessonInserts.length > 0) {
          await supabase.from("enrollment_lessons").insert(lessonInserts);
        }
      }
    }

    toast.success(isEdit ? "Matrícula atualizada" : "Matrícula criada");
    navigate("/admin/enrollments");
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/enrollments")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar Matrícula" : "Nova Matrícula"}</h1>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/enrollments")}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : isEdit ? "Salvar" : "Criar Matrícula"}
          </Button>
        </div>
      </div>

      <div className="space-y-6 max-w-3xl">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Aluno *</Label>
            <Select value={form.student_id} onValueChange={(v) => update("student_id", v)}>
              <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione um aluno" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.email})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Produto *</Label>
            <Select value={form.course_id} onValueChange={(v) => {
              update("course_id", v);
              setSelectedModules(new Set());
              setSelectedLessons(new Set());
              setAccessMode("full");
            }}>
              <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Origem</Label>
            <Select value={form.origin || "manual"} onValueChange={(v) => update("origin", v)}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">Compra</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="bonus">Bônus</SelectItem>
                <SelectItem value="test">Teste</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Status</Label>
            <Select value={form.status || "active"} onValueChange={(v) => update("status", v)}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
                <SelectItem value="blocked">Bloqueada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Granular access control */}
        {form.course_id && modulesWithLessons.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[13px] font-medium">Acesso ao Conteúdo</Label>
              <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs">
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md transition-colors ${accessMode === "full" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setAccessMode("full")}
                >
                  Acesso Completo
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-md transition-colors ${accessMode === "custom" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setAccessMode("custom")}
                >
                  Personalizado
                </button>
              </div>
            </div>

            {accessMode === "full" ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">O aluno terá acesso a todos os módulos e aulas deste produto.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                {modulesWithLessons.map((mod) => {
                  const isModuleSelected = selectedModules.has(mod.id);
                  const isExpanded = expandedModules.has(mod.id);
                  const selectedCount = mod.lessons.filter((l) => selectedLessons.has(l.id)).length;
                  const allLessonsSelected = mod.lessons.length > 0 && selectedCount === mod.lessons.length;

                  return (
                    <div key={mod.id} className="border-b border-border last:border-0">
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                        <Checkbox
                          checked={allLessonsSelected}
                          onCheckedChange={() => toggleModule(mod.id, mod.lessons)}
                          className="border-border"
                        />
                        <button
                          type="button"
                          className="flex items-center gap-2 flex-1 text-left"
                          onClick={() => toggleExpand(mod.id)}
                        >
                          {mod.lessons.length > 0 ? (
                            isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : <div className="w-3.5" />}
                          <span className="text-sm font-medium text-foreground">{mod.title}</span>
                          {mod.lessons.length > 0 && (
                            <span className="text-xs text-muted-foreground ml-auto font-mono">
                              {selectedCount}/{mod.lessons.length} aulas
                            </span>
                          )}
                        </button>
                      </div>

                      {isExpanded && mod.lessons.length > 0 && (
                        <div className="border-t border-border bg-muted/10">
                          {mod.lessons.map((lesson) => (
                            <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 pl-12 hover:bg-muted/20 transition-colors">
                              <Checkbox
                                checked={selectedLessons.has(lesson.id)}
                                onCheckedChange={() => toggleLesson(lesson.id, mod.id, mod.lessons)}
                                className="border-border"
                              />
                              <span className="text-sm text-foreground">{lesson.title}</span>
                              <span className="text-[11px] text-muted-foreground font-mono ml-auto">{lesson.lesson_type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Data de Expiração (opcional)</Label>
            <Input type="date" value={form.expires_at ? new Date(form.expires_at).toISOString().split("T")[0] : ""} onChange={(e) => update("expires_at", e.target.value ? new Date(e.target.value).toISOString() : null)} className="bg-background border-border" />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[13px] font-medium">Observações</Label>
          <Textarea value={form.notes || ""} onChange={(e) => update("notes", e.target.value)} className="bg-background border-border" rows={4} placeholder="Notas internas sobre esta matrícula..." />
        </div>
      </div>
    </div>
  );
}
