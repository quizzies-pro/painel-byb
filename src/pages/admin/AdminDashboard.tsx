import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Layers, FileText, Users, CreditCard, GraduationCap, AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const STATUS_COLORS: Record<string, { fill: string; label: string }> = {
  approved: { fill: "#22C55E", label: "Aprovado" },
  pending: { fill: "#F97316", label: "Pendente" },
  refunded: { fill: "#3B82F6", label: "Reembolsado" },
  canceled: { fill: "#A1A1AA", label: "Cancelado" },
  chargeback: { fill: "#EF4444", label: "Chargeback" },
  expired: { fill: "#D4D4D8", label: "Expirado" },
  failed: { fill: "#B91C1C", label: "Falhou" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-foreground text-primary-foreground px-3 py-2 rounded-md shadow-dropdown text-xs">
      <p className="font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="opacity-80">
          {p.name === "total" ? "Receita" : p.name}: R$ {Number(p.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-foreground text-primary-foreground px-3 py-2 rounded-md shadow-dropdown text-xs">
      <p className="font-medium">{STATUS_COLORS[d.name]?.label || d.name}</p>
      <p className="opacity-80">{d.value} pagamento(s)</p>
    </div>
  );
};

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ courses: 0, modules: 0, lessons: 0, students: 0, payments: 0, enrollments: 0 });
  const [recentStudents, setRecentStudents] = useState<{ name: string; email: string; created_at: string }[]>([]);
  const [paymentsByStatus, setPaymentsByStatus] = useState<{ name: string; value: number }[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<{ month: string; total: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
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

      const { data: rs } = await supabase.from("students").select("name, email, created_at").order("created_at", { ascending: false }).limit(5);
      setRecentStudents(rs ?? []);

      const { data: allPayments } = await supabase.from("payments").select("status, amount, approved_at");
      if (allPayments) {
        const statusMap: Record<string, number> = {};
        allPayments.forEach((p) => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
        setPaymentsByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

        const monthMap: Record<string, number> = {};
        let rev = 0;
        allPayments.filter(p => p.status === 'approved').forEach((p) => {
          rev += Number(p.amount);
          const date = p.approved_at ? new Date(p.approved_at) : new Date();
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthMap[key] = (monthMap[key] || 0) + Number(p.amount);
        });
        setTotalRevenue(rev);

        const months: { month: string; total: number }[] = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          months.push({ month: key, total: monthMap[key] || 0 });
        }
        setRevenueByMonth(months);
      }

      const alertList: string[] = [];
      const { data: coursesNoModules } = await supabase.from("courses").select("id, title").eq("status", "published");
      if (coursesNoModules) {
        for (const course of coursesNoModules) {
          const { count } = await supabase.from("course_modules").select("id", { count: "exact", head: true }).eq("course_id", course.id);
          if (!count || count === 0) alertList.push(`Produto "${course.title}" não tem módulos`);
        }
      }
      const { count: pendingPayments } = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending");
      if (pendingPayments && pendingPayments > 0) alertList.push(`${pendingPayments} pagamento(s) pendente(s)`);
      setAlerts(alertList);
    };
    fetchData();
  }, []);

  const stats = [
    { label: "Produtos", value: counts.courses, icon: BookOpen, color: "text-foreground" },
    { label: "Módulos", value: counts.modules, icon: Layers, color: "text-foreground" },
    { label: "Aulas", value: counts.lessons, icon: FileText, color: "text-foreground" },
    { label: "Alunos", value: counts.students, icon: Users, color: "text-info-text" },
    { label: "Pagamentos", value: counts.payments, icon: CreditCard, color: "text-success-text" },
    { label: "Matrículas", value: counts.enrollments, icon: GraduationCap, color: "text-foreground" },
  ];

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${months[parseInt(mo) - 1]} ${y.slice(2)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visão geral da plataforma</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2.5 px-4 py-3 rounded-lg border bg-warning-subtle text-warning-text text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{a}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</span>
              <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-semibold font-mono text-foreground">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue highlight */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-card">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-foreground">Receita Total Aprovada</span>
          </div>
          <span className="text-2xl font-semibold font-mono text-foreground">
            R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Revenue by month */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Receita por Mês</span>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMonth} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  tick={{ fill: '#71717A', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71717A', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F4F4F5' }} />
                <Bar dataKey="total" fill="#000000" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payments by status */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Pagamentos por Status</span>
          </div>
          <div className="h-[220px]">
            {paymentsByStatus.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Sem dados</p>
              </div>
            ) : (
              <div className="flex items-center h-full gap-4">
                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentsByStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        innerRadius={45}
                        strokeWidth={2}
                        stroke="#FFFFFF"
                      >
                        {paymentsByStatus.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.name]?.fill || "#A1A1AA"} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-2 pr-2">
                  {paymentsByStatus.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: STATUS_COLORS[entry.name]?.fill || "#A1A1AA" }}
                      />
                      <span className="text-2xs text-muted-foreground whitespace-nowrap">
                        {STATUS_COLORS[entry.name]?.label || entry.name}
                      </span>
                      <span className="text-2xs font-medium text-foreground ml-auto font-mono">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-card border border-border rounded-lg shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <span className="text-sm font-medium text-foreground">Últimos Alunos</span>
        </div>
        <div className="px-5 py-2">
          {recentStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum aluno ainda</p>
          ) : (
            <div>
              {recentStudents.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium text-foreground">{s.name}</div>
                    <div className="text-2xs text-muted-foreground font-mono mt-0.5">{s.email}</div>
                  </div>
                  <div className="text-2xs text-muted-foreground">{formatDate(s.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
