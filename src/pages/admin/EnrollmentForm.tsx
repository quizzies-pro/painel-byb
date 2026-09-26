import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Search, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { usePreviousPage } from "@/hooks/usePreviousPage";
import { toast } from "sonner";

type Student = Pick<Tables<"students">, "id" | "name" | "email" | "phone" | "avatar_url" | "status">;

export default function EnrollmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = usePreviousPage("/admin/enrollments");
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      supabase.from("enrollments").select("student_id, course_id").eq("id", id).single().then(({ data, error }) => {
        if (error || !data) { toast.error("Matrícula não encontrada"); navigate("/admin/enrollments", { replace: true }); return; }
        navigate(`/admin/students/${data.student_id}/view?product=${data.course_id}`, { replace: true });
      });
      return;
    }
    supabase.from("students").select("id, name, email, phone, avatar_url, status").order("name").then(({ data, error }) => {
      if (error) toast.error("Não foi possível carregar os alunos"); else setStudents(data ?? []);
      setLoading(false);
    });
  }, [id, navigate]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((student) => !term || student.name.toLowerCase().includes(term) || student.email.toLowerCase().includes(term) || student.phone?.includes(term));
  }, [search, students]);

  if (id || loading) return <div className="space-y-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>;

  return <div className="student-workspace space-y-6">
    <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft /></Button><div><h1 className="workspace-title text-2xl font-semibold">Liberar produto para aluno</h1><p className="mt-1 text-sm text-muted-foreground">Primeiro selecione o aluno que receberá o acesso.</p></div></div>
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border p-5"><div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail ou telefone..." className="pl-9" /></div></div>
      {filtered.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">Nenhum aluno encontrado</div> : filtered.map((student) => <button key={student.id} type="button" onClick={() => navigate(`/admin/students/${student.id}/view`)} className="flex w-full items-center gap-4 border-b border-border px-5 py-3 text-left transition-colors last:border-0 hover:bg-workspace-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-workspace-accent">
        <Avatar className="h-10 w-10 border border-border"><AvatarImage src={student.avatar_url || undefined} alt="" /><AvatarFallback><UserRound className="h-4 w-4" /></AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{student.name}</p><p className="truncate text-xs text-muted-foreground">{student.email}{student.phone ? ` · ${student.phone}` : ""}</p></div>
        <span className="text-xs capitalize text-muted-foreground">{student.status}</span><ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>)}
    </section>
  </div>;
}
