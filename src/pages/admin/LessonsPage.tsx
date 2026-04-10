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

type Lesson = Tables<"lessons"> & { course_modules?: { title: string } | null; courses?: { title: string } | null };
type Course = Tables<"courses">;

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [lRes, cRes] = await Promise.all([
      supabase.from("lessons").select("*, course_modules(title), courses(title)").order("sort_order"),
      supabase.from("courses").select("id, title").order("title"),
    ]);
    setLessons((lRes.data as Lesson[]) ?? []);
    setCourses(cRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta aula?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Aula excluída"); fetchData(); }
  };

  const filtered = lessons.filter((l) => {
    const matchCourse = selectedCourse === "all" || l.course_id === selectedCourse;
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase());
    return matchCourse && matchSearch;
  });

  const typeLabel: Record<string, string> = { video: "Vídeo", text: "Texto", audio: "Áudio", download: "Download", hybrid: "Híbrido" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aulas</h1>
          <p className="text-sm text-muted-foreground mt-1">{lessons.length} aulas cadastradas</p>
        </div>
        <Link to="/admin/lessons/new">
          <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Nova Aula</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar aulas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
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
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma aula encontrada</div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Módulo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{l.title}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{l.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.course_modules?.title || "—"}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="font-mono text-xs">{typeLabel[l.lesson_type] || l.lesson_type}</Badge></td>
                  <td className="px-4 py-3"><Badge variant="outline">{l.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/lessons/${l.id}`}><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Edit className="h-3.5 w-3.5" /></Button></Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
