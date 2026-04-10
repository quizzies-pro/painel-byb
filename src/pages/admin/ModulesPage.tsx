import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Module = Tables<"course_modules"> & { courses?: { title: string } | null };
type CourseOption = Pick<Tables<"courses">, "id" | "title">;

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [mRes, cRes] = await Promise.all([
      supabase.from("course_modules").select("*, courses(title)").order("sort_order"),
      supabase.from("courses").select("id, title").order("title"),
    ]);
    setModules((mRes.data as Module[]) ?? []);
    setCourses(cRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este módulo?")) return;
    const { error } = await supabase.from("course_modules").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Módulo excluído"); fetchData(); }
  };

  const filtered = modules.filter((m) => {
    const matchCourse = selectedCourse === "all" || m.course_id === selectedCourse;
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    return matchCourse && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Módulos</h1>
          <p className="text-sm text-muted-foreground mt-1">{modules.length} módulos cadastrados</p>
        </div>
        <Link to="/admin/modules/new">
          <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Novo Módulo</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar módulos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[200px] bg-card border-border"><SelectValue placeholder="Filtrar por curso" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cursos</SelectItem>
            {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhum módulo encontrado</div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Curso</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Liberação</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{m.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.courses?.title || "—"}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{m.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{m.release_type}{m.release_days ? ` (${m.release_days}d)` : ""}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/modules/${m.id}`}><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit className="h-3.5 w-3.5" /></Button></Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
