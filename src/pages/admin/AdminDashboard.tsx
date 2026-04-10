import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Layers, FileText, Users, CreditCard, GraduationCap, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ courses: 0, modules: 0, lessons: 0, students: 0, payments: 0, enrollments: 0 });
  const [recentStudents, setRecentStudents] = useState<{ name: string; email: string; created_at: string }[]>([]);
  const [paymentsByStatus, setPaymentsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; total: number }[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [c, m, l, s, p, e] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("course_modules").select("id", { count: "exact", head: true }),
        supabase.from("lessons").select("id", { count: "exact", head: true }),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("payments").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
      ]);
      setCounts({
        courses: c.count ?? 0, modules: m.count ?? 0, lessons: l.count ?? 0,
        students: s.count ?? 0, payments: p.count ?? 0, enrollments: e.count ?? 0,
      });

      // Recent students
      const { data: rs } = await supabase.from("students").select("name, email, created_at").order("created_at", { ascending: false }).limit(5);
      setRecentStudents(rs ?? []);

      // Payments by status
      const { data: allPayments } = await supabase.from("payments").select("status, amount");
      if (allPayments) {
        const statusMap: Record<string, number> = {};
        allPayments.forEach((p) => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
        setPaymentsByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

        // Revenue by month (approved only)
        const monthMap: Record<string, number> = {};
        allPayments.filter(p => p.status === 'approved').forEach((p) => {
          const d = new Date();
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          monthMap[key] = (monthMap[key] || 0) + Number(p.amount);
        });
        // Generate last 6 months
        const months: { month: string; total: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          months.push({ month: key, total: monthMap[key] || 0 });
        }
        setRevenueByMonth(months);
      }

      // Alerts
      const alertList: string[] = [];
      const { data: coursesNoModules } = await supabase.from("courses").select("id, title").eq("status", "published");
      if (coursesNoModules) {
        for (const course of coursesNoModules) {
          const { count } = await supabase.from("course_modules").select("id", { count: "exact", head: true }).eq("course_id", course.id);
          if (!count || count === 0) alertList.push(`Curso "${course.title}" não tem módulos`);
        }
      }
      const { count: pendingPayments } = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending");
      if (pendingPayments && pendingPayments > 0) alertList.push(`${pendingPayments} pagamento(s) pendente(s)`);
      setAlerts(alertList);
    };
    fetch();
  }, []);

  const stats = [
    { label: "Cursos", value: counts.courses, icon: BookOpen },
    { label: "Módulos", value: counts.modules, icon: Layers },
    { label: "Aulas", value: counts.lessons, icon: FileText },
    { label: "Alunos", value: counts.students, icon: Users },
    { label: "Pagamentos", value: counts.payments, icon: CreditCard },
    { label: "Matrículas", value: counts.enrollments, icon: GraduationCap },
  ];

  const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444", "#6b7280", "#f97316", "#8b5cf6", "#3b82f6"];
  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral da TTS Academy</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 text-yellow-400 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {a}
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-semibold font-mono">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Receita por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByMonth}>
                  <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="total" fill="#fff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pagamentos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              {paymentsByStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {paymentsByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Students */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Últimos Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          {recentStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aluno ainda</p>
          ) : (
            <div className="space-y-2">
              {recentStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{s.email}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(s.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
