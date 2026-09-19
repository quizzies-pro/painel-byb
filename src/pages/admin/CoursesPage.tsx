import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { PRODUCT_TYPES, ProductType } from "@/lib/product-types";
import { PACK_FORMATS } from "@/lib/pack-formats";

type Course = Tables<"courses">;
type CategoryLink = Tables<"storefront_category_courses"> & {
  storefront_categories: Pick<Tables<"storefront_categories">, "name"> | null;
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  hidden: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  archived: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  hidden: "Oculto",
  archived: "Arquivado",
};

const visibilityLabels = (course: Course) => {
  const labels: string[] = [];
  if (course.status !== "published") labels.push("Em construção");
  if (!course.storefront_visible) labels.push("Prévia privada");
  else labels.push("Na vitrine");
  labels.push(course.available_for_sale ? "À venda" : "Fora de venda");
  return labels;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "grid">("grid");
  const [categoryNames, setCategoryNames] = useState<Record<string, string[]>>({});
  const [typeFilter, setTypeFilter] = useState<"all" | ProductType>("all");

  const fetchCourses = async () => {
    setLoading(true);
    const [coursesResponse, linksResponse] = await Promise.all([
      supabase.from("courses").select("*").order("display_order", { ascending: true }),
      supabase.from("storefront_category_courses").select("*, storefront_categories(name)"),
    ]);
    if (coursesResponse.error || linksResponse.error) toast.error("Erro ao carregar produtos");
    else {
      setCourses(coursesResponse.data ?? []);
      const grouped = ((linksResponse.data ?? []) as CategoryLink[]).reduce<Record<string, string[]>>((result, link) => {
        const name = link.storefront_categories?.name;
        if (!name) return result;
        result[link.course_id] = [...(result[link.course_id] ?? []), name];
        return result;
      }, {});
      setCategoryNames(grouped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir produto");
    else {
      toast.success("Produto excluído");
      fetchCourses();
    }
  };

  const filtered = courses.filter((course) => {
    const matchesType = typeFilter === "all" || course.product_type === typeFilter;
    const term = search.toLowerCase();
    const matchesSearch = course.title.toLowerCase().includes(term) || Boolean(course.category?.toLowerCase().includes(term));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">{courses.length} produtos cadastrados</p>
        </div>
        <Link to="/admin/courses/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Novo Produto
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as "all" | ProductType)}>
          <SelectTrigger className="w-40 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem value="course">Cursos</SelectItem><SelectItem value="pack">Packs</SelectItem></SelectContent>
        </Select>
        <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-md ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-md ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado ainda"}
        </div>
      ) : view === "list" ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Disponibilidade</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((course) => (
                <tr key={course.id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2"><span className="font-medium text-foreground">{course.title}</span><Badge variant="outline" className="text-[10px]">{PRODUCT_TYPES[course.product_type].label}</Badge></div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{course.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(categoryNames[course.id] ?? []).length > 0
                        ? categoryNames[course.id].map((name) => <Badge key={name} variant="outline" className="text-[10px] font-normal">{name}</Badge>)
                        : <span className="text-muted-foreground">Sem categoria</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className={statusColors[course.status] || ""}>{statusLabel[course.status] || course.status}</Badge>
                      {visibilityLabels(course).map((label) => <Badge key={label} variant="secondary" className="text-[10px] font-normal">{label}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/courses/${course.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(course.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((course) => (
            <div key={course.id} className="group rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-muted-foreground/30">
              <Link to={`/admin/courses/${course.id}`}>
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  {course.cover_url ? (
                    <img
                      src={course.cover_url}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <LayoutGrid className="h-10 w-10" />
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4 space-y-2">
                <Link to={`/admin/courses/${course.id}`}>
                    <div className="flex items-center gap-2"><h3 className="font-medium text-foreground text-sm leading-tight group-hover:underline">{course.title}</h3><Badge variant="outline" className="text-[10px]">{PRODUCT_TYPES[course.product_type].label}</Badge></div>
                </Link>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={`text-[11px] ${statusColors[course.status] || ""}`}>{statusLabel[course.status] || course.status}</Badge>
                    {visibilityLabels(course).map((label) => <Badge key={label} variant="secondary" className="text-[10px] font-normal">{label}</Badge>)}
                    {course.product_type === "pack" && course.pack_format && <Badge variant="secondary" className="text-[10px] font-normal">{PACK_FORMATS[course.pack_format].label}</Badge>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(course.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(categoryNames[course.id] ?? []).length > 0 ? categoryNames[course.id].join(" · ") : "Sem categoria de apresentação"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
