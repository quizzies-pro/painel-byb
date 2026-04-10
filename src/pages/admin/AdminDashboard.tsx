import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Layers, FileText } from "lucide-react";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ courses: 0, modules: 0, lessons: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const [c, m, l] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("course_modules").select("id", { count: "exact", head: true }),
        supabase.from("lessons").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        courses: c.count ?? 0,
        modules: m.count ?? 0,
        lessons: l.count ?? 0,
      });
    };
    fetchCounts();
  }, []);

  const stats = [
    { label: "Cursos", value: counts.courses, icon: BookOpen },
    { label: "Módulos", value: counts.modules, icon: Layers },
    { label: "Aulas", value: counts.lessons, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumo do conteúdo da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold font-mono">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
