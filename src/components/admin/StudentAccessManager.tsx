import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Package, Plus, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { resolveProductCover } from "@/lib/product-presentation-media";
import { PRODUCT_TYPES } from "@/lib/product-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Product = Tables<"courses">;
type Enrollment = Tables<"enrollments">;
type Module = Tables<"course_modules">;
type Lesson = Tables<"lessons">;
type EnrollmentStatus = Enrollment["status"];
type EnrollmentOrigin = Enrollment["origin"];

interface ModuleWithLessons extends Module { lessons: Lesson[]; }
interface EnrollmentDraft { status: EnrollmentStatus; origin: EnrollmentOrigin; expires_at: string; notes: string; }
interface StudentAccessManagerProps { studentId: string; initialProductId?: string | null; onChanged?: () => void; }

const statusLabels: Record<EnrollmentStatus, string> = { active: "Ativa", expired: "Expirada", canceled: "Cancelada", blocked: "Bloqueada" };
const statusClasses: Record<EnrollmentStatus, string> = {
  active: "border-success/30 bg-success/10 text-success-text",
  expired: "border-warning/30 bg-warning/10 text-warning-text",
  canceled: "border-border bg-muted text-muted-foreground",
  blocked: "border-destructive/30 bg-destructive/10 text-destructive",
};
const toDateInput = (value: string | null) => value ? new Date(value).toISOString().split("T")[0] : "";

export default function StudentAccessManager({ studentId, initialProductId, onChanged }: StudentAccessManagerProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addingProduct, setAddingProduct] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EnrollmentDraft>({ status: "active", origin: "manual", expires_at: "", notes: "" });
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [accessMode, setAccessMode] = useState<"full" | "custom">("full");
  const initialProductOpened = useRef(false);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const [productsResult, enrollmentsResult] = await Promise.all([
      supabase.from("courses").select("*").order("display_order").order("title"),
      supabase.from("enrollments").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
    ]);
    if (productsResult.error || enrollmentsResult.error) toast.error("Não foi possível carregar os acessos do aluno");
    else { setProducts(productsResult.data ?? []); setEnrollments(enrollmentsResult.data ?? []); }
    if (showLoading) setLoading(false);
  };

  useEffect(() => { fetchData(); }, [studentId]);

  const enrollmentByProduct = useMemo(() => {
    const map = new Map<string, Enrollment>();
    enrollments.forEach((enrollment) => { if (!map.has(enrollment.course_id)) map.set(enrollment.course_id, enrollment); });
    return map;
  }, [enrollments]);

  const enrolledProducts = useMemo(() => products.filter((product) => enrollmentByProduct.has(product.id)), [enrollmentByProduct, products]);
  const availableProducts = useMemo(() => products.filter((product) => !enrollmentByProduct.has(product.id) && product.id !== pendingProductId), [enrollmentByProduct, pendingProductId, products]);
  const visibleProducts = useMemo(() => {
    const pendingProduct = pendingProductId ? products.find((product) => product.id === pendingProductId) : undefined;
    return pendingProduct ? [...enrolledProducts, pendingProduct] : enrolledProducts;
  }, [enrolledProducts, pendingProductId, products]);

  const filteredProducts = useMemo(() => visibleProducts.filter((product) => {
    const enrollment = enrollmentByProduct.get(product.id);
    const term = search.trim().toLowerCase();
    return (!term || product.title.toLowerCase().includes(term))
      && (typeFilter === "all" || product.product_type === typeFilter)
      && (statusFilter === "all" || enrollment?.status === statusFilter);
  }), [enrollmentByProduct, search, statusFilter, typeFilter, visibleProducts]);

  const selectProduct = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPendingProductId(productId);
    setAddingProduct(false);
    openProduct(product, true);
  };

  const cancelProduct = () => {
    if (expandedProductId === pendingProductId) setExpandedProductId(null);
    setPendingProductId(null);
    setAddingProduct(false);
  };

  const openProduct = async (product: Product, force = false) => {
    if (!force && expandedProductId === product.id) { setExpandedProductId(null); return; }
    const enrollment = enrollmentByProduct.get(product.id);
    setExpandedProductId(product.id);
    setDraft({ status: enrollment?.status ?? "active", origin: enrollment?.origin ?? "manual", expires_at: toDateInput(enrollment?.expires_at ?? null), notes: enrollment?.notes ?? "" });
    setModules([]); setSelectedModules(new Set()); setSelectedLessons(new Set()); setExpandedModules(new Set()); setAccessMode("full");
    if (product.product_type !== "course") return;
    const [moduleResult, lessonResult] = await Promise.all([
      supabase.from("course_modules").select("*").eq("course_id", product.id).order("sort_order"),
      supabase.from("lessons").select("*").eq("course_id", product.id).order("sort_order"),
    ]);
    setModules((moduleResult.data ?? []).map((module) => ({ ...module, lessons: (lessonResult.data ?? []).filter((lesson) => lesson.module_id === module.id) })));
    if (!enrollment) return;
    const [moduleAccess, lessonAccess] = await Promise.all([
      supabase.from("enrollment_modules").select("module_id").eq("enrollment_id", enrollment.id),
      supabase.from("enrollment_lessons").select("lesson_id").eq("enrollment_id", enrollment.id),
    ]);
    const moduleIds = new Set((moduleAccess.data ?? []).map((item) => item.module_id));
    const lessonIds = new Set((lessonAccess.data ?? []).map((item) => item.lesson_id));
    setSelectedModules(moduleIds); setSelectedLessons(lessonIds);
    if (moduleIds.size || lessonIds.size) setAccessMode("custom");
  };

  useEffect(() => {
    if (!loading && initialProductId && !initialProductOpened.current) {
      const product = products.find((item) => item.id === initialProductId);
      if (product) {
        initialProductOpened.current = true;
        openProduct(product, true);
      }
    }
  }, [loading, initialProductId, products]);

  const toggleModule = (module: ModuleWithLessons) => {
    const nextModules = new Set(selectedModules); const nextLessons = new Set(selectedLessons);
    if (nextModules.has(module.id)) { nextModules.delete(module.id); module.lessons.forEach((lesson) => nextLessons.delete(lesson.id)); }
    else { nextModules.add(module.id); module.lessons.forEach((lesson) => nextLessons.add(lesson.id)); }
    setSelectedModules(nextModules); setSelectedLessons(nextLessons);
  };

  const toggleLesson = (module: ModuleWithLessons, lessonId: string) => {
    const nextLessons = new Set(selectedLessons); nextLessons.has(lessonId) ? nextLessons.delete(lessonId) : nextLessons.add(lessonId);
    const nextModules = new Set(selectedModules);
    module.lessons.some((lesson) => nextLessons.has(lesson.id)) ? nextModules.add(module.id) : nextModules.delete(module.id);
    setSelectedLessons(nextLessons); setSelectedModules(nextModules);
  };

  const saveAccess = async (product: Product) => {
    setSaving(true);
    const existing = enrollmentByProduct.get(product.id);
    const payload = { student_id: studentId, course_id: product.id, status: draft.status, origin: draft.origin, expires_at: draft.expires_at ? new Date(`${draft.expires_at}T23:59:59`).toISOString() : null, notes: draft.notes.trim() || null, created_by: user?.id };
    const result = existing
      ? await supabase.from("enrollments").update(payload).eq("id", existing.id).select("id").single()
      : await supabase.from("enrollments").insert(payload).select("id").single();
    if (result.error || !result.data) { toast.error(result.error?.code === "23505" ? "Este aluno já possui acesso a este produto" : "Não foi possível salvar a matrícula"); setSaving(false); return; }
    const enrollmentId = result.data.id;
    const cleared = await Promise.all([supabase.from("enrollment_modules").delete().eq("enrollment_id", enrollmentId), supabase.from("enrollment_lessons").delete().eq("enrollment_id", enrollmentId)]);
    if (cleared.some((item) => item.error)) { toast.error("A matrícula foi salva, mas não foi possível atualizar as permissões"); setSaving(false); return; }
    if (product.product_type === "course" && accessMode === "custom") {
      const moduleRows = Array.from(selectedModules).map((module_id) => ({ enrollment_id: enrollmentId, module_id }));
      const lessonRows = Array.from(selectedLessons).map((lesson_id) => ({ enrollment_id: enrollmentId, lesson_id }));
      const inserts = await Promise.all([
        moduleRows.length ? supabase.from("enrollment_modules").insert(moduleRows) : Promise.resolve({ error: null }),
        lessonRows.length ? supabase.from("enrollment_lessons").insert(lessonRows) : Promise.resolve({ error: null }),
      ]);
      if (inserts.some((item) => item.error)) { toast.error("A matrícula foi salva, mas não foi possível concluir as permissões personalizadas"); setSaving(false); return; }
    }
    toast.success(existing ? "Acesso atualizado" : "Acesso liberado");
    setPendingProductId(null);
    await fetchData(false); onChanged?.(); setExpandedProductId(product.id); setSaving(false);
  };

  if (loading) return <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>;

  return <section className="student-workspace overflow-hidden rounded-lg border border-border bg-card">
    <div className="border-b border-border p-4 sm:p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <div><h2 className="workspace-title text-lg font-semibold">Acessos e produtos</h2><p className="mt-1 text-sm text-muted-foreground">{enrollments.filter((item) => item.status === "active").length} acessos ativos</p></div>
      <div className="flex flex-col gap-2 sm:flex-row"><div className="relative min-w-0 sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto..." className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os acessos</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="expired">Expirados</SelectItem><SelectItem value="canceled">Cancelados</SelectItem><SelectItem value="blocked">Bloqueados</SelectItem></SelectContent></Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger className="sm:w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem value="course">Cursos</SelectItem><SelectItem value="pack">Packs</SelectItem></SelectContent></Select>
        <Button type="button" size="sm" className="h-10 shrink-0" onClick={() => setAddingProduct(true)} disabled={availableProducts.length === 0}><Plus />Adicionar produto</Button>
      </div>
    </div></div>
    {addingProduct && <div className="flex flex-col gap-3 border-b border-border bg-muted/30 p-4 sm:flex-row sm:items-end sm:px-5"><div className="min-w-0 flex-1 space-y-2"><Label>Produto</Label><Select onValueChange={selectProduct}><SelectTrigger><SelectValue placeholder="Selecione um produto para liberar" /></SelectTrigger><SelectContent>{availableProducts.map((product) => <SelectItem key={product.id} value={product.id}>{product.title} · {PRODUCT_TYPES[product.product_type].label}</SelectItem>)}</SelectContent></Select></div><Button type="button" variant="ghost" size="icon" onClick={cancelProduct} aria-label="Cancelar adição"><X /></Button></div>}
    <div className="hidden grid-cols-[minmax(240px,1fr)_120px_120px_130px_140px] gap-4 border-b border-border bg-muted/40 px-5 py-2.5 text-xs font-medium text-muted-foreground lg:grid"><span>Produto</span><span>Situação</span><span>Origem</span><span>Validade</span><span className="text-right">Ação</span></div>
    {filteredProducts.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">{enrolledProducts.length === 0 ? "Este aluno ainda não possui produtos" : "Nenhum produto encontrado"}</div> : filteredProducts.map((product) => {
      const enrollment = enrollmentByProduct.get(product.id); const isOpen = expandedProductId === product.id; const image = resolveProductCover(product, "16:9").url;
      return <div key={product.id} className="border-b border-border last:border-b-0">
        <div className={`grid gap-4 px-4 py-3 transition-colors sm:px-5 lg:grid-cols-[minmax(240px,1fr)_120px_120px_130px_140px] lg:items-center ${isOpen ? "bg-workspace-accent-subtle" : "hover:bg-muted/30"}`}>
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">{image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-muted-foreground" />}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{product.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{PRODUCT_TYPES[product.product_type].label}{enrollment ? " · Acesso cadastrado" : " · Sem acesso"}</p></div></div>
          <div><Badge variant="outline" className={enrollment ? statusClasses[enrollment.status] : "border-border bg-muted text-muted-foreground"}>{enrollment ? statusLabels[enrollment.status] : "Disponível"}</Badge></div>
          <span className="text-sm text-muted-foreground">{enrollment?.origin ?? "—"}</span><span className="text-sm text-muted-foreground">{enrollment?.expires_at ? new Date(enrollment.expires_at).toLocaleDateString("pt-BR") : enrollment ? "Sem expiração" : "—"}</span>
          <div className="flex justify-end"><Button variant={enrollment ? "ghost" : "outline"} size="sm" onClick={() => openProduct(product)} className={isOpen ? "text-workspace-accent" : ""}>{enrollment ? "Editar acesso" : "Liberar acesso"}{isOpen ? <ChevronDown /> : <ChevronRight />}</Button></div>
        </div>
        {isOpen && <div className="border-t border-workspace-accent/20 bg-workspace-accent-subtle/40 p-4 sm:p-6"><div className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><Label>Origem</Label><Select value={draft.origin} onValueChange={(value) => setDraft((current) => ({ ...current, origin: value as EnrollmentOrigin }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="purchase">Compra</SelectItem><SelectItem value="manual">Manual</SelectItem><SelectItem value="bonus">Bônus</SelectItem><SelectItem value="test">Teste</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Status</Label><Select value={draft.status} onValueChange={(value) => setDraft((current) => ({ ...current, status: value as EnrollmentStatus }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Ativa</SelectItem><SelectItem value="expired">Expirada</SelectItem><SelectItem value="canceled">Cancelada</SelectItem><SelectItem value="blocked">Bloqueada</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Validade</Label><Input type="date" value={draft.expires_at} onChange={(event) => setDraft((current) => ({ ...current, expires_at: event.target.value }))} /></div>
          </div><div className="space-y-2"><Label>Observações</Label><Textarea rows={3} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Notas internas sobre esta matrícula..." /></div></div>
          <div className="space-y-4">{product.product_type === "pack" ? <div className="rounded-md border border-border bg-background p-4"><p className="text-sm font-medium">Acesso integral ao Pack</p><p className="mt-1 text-xs text-muted-foreground">Inclui todas as coleções, itens e vídeos publicados.</p></div> : <><div className="flex items-center justify-between gap-4"><Label>Nível de acesso</Label><div className="flex rounded-md border border-border bg-muted p-0.5"><Button type="button" variant={accessMode === "full" ? "secondary" : "ghost"} size="sm" onClick={() => setAccessMode("full")}>Completo</Button><Button type="button" variant={accessMode === "custom" ? "secondary" : "ghost"} size="sm" onClick={() => setAccessMode("custom")}>Personalizado</Button></div></div>
            {accessMode === "full" ? <div className="rounded-md border border-border bg-background p-4 text-sm text-muted-foreground">Todos os módulos e aulas ficam disponíveis.</div> : <div className="overflow-hidden rounded-md border border-border bg-background">{modules.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Este curso ainda não possui módulos.</p> : modules.map((module) => { const open = expandedModules.has(module.id); const count = module.lessons.filter((lesson) => selectedLessons.has(lesson.id)).length; return <div key={module.id} className="border-b border-border last:border-0"><div className="flex items-center gap-3 px-4 py-3"><Checkbox checked={selectedModules.has(module.id)} onCheckedChange={() => toggleModule(module)} /><Button type="button" variant="ghost" className="h-auto flex-1 justify-start px-0 py-0" onClick={() => setExpandedModules((current) => { const next = new Set(current); next.has(module.id) ? next.delete(module.id) : next.add(module.id); return next; })}>{open ? <ChevronDown /> : <ChevronRight />}<span className="truncate">{module.title}</span><span className="ml-auto text-xs text-muted-foreground">{count}/{module.lessons.length}</span></Button></div>{open && module.lessons.map((lesson) => <label key={lesson.id} className="flex items-center gap-3 border-t border-border bg-muted/20 px-5 py-2.5 pl-12 text-sm"><Checkbox checked={selectedLessons.has(lesson.id)} onCheckedChange={() => toggleLesson(module, lesson.id)} />{lesson.title}</label>)}</div>; })}</div>}</>}</div>
        </div><div className="mt-6 flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" onClick={() => enrollment ? setExpandedProductId(null) : cancelProduct()}>Cancelar</Button><Button type="button" onClick={() => saveAccess(product)} disabled={saving}>{saving ? "Salvando..." : enrollment ? "Salvar alterações" : "Liberar acesso"}</Button></div></div>}
      </div>;
    })}
  </section>;
}
