import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Payment = Tables<"payments"> & { students?: { name: string; email: string } | null; courses?: { title: string } | null };

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  refunded: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  canceled: "bg-muted text-muted-foreground",
  chargeback: "bg-red-500/10 text-red-400 border-red-500/20",
  expired: "bg-muted text-muted-foreground",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente", approved: "Aprovado", refunded: "Reembolsado",
  canceled: "Cancelado", chargeback: "Chargeback", expired: "Expirado", failed: "Falhou",
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedPayload, setSelectedPayload] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    let query = supabase.from("payments").select("*, students(name, email), courses(title)").order("created_at", { ascending: false });
    if (statusFilter !== "all") query = query.eq("status", statusFilter as Payment["status"]);
    const { data, error } = await query;
    if (error) toast.error("Erro ao carregar pagamentos");
    else setPayments((data as Payment[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPayments(); }, [statusFilter]);

  const filtered = payments.filter((p) =>
    p.students?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.students?.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.external_payment_id?.includes(search) ||
    p.product_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pagamentos</h1>
        <p className="text-sm text-muted-foreground mt-1">{payments.length} pagamentos registrados</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por aluno, produto ou ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="approved">Aprovados</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="refunded">Reembolsados</SelectItem>
            <SelectItem value="canceled">Cancelados</SelectItem>
            <SelectItem value="chargeback">Chargeback</SelectItem>
            <SelectItem value="failed">Falhos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhum pagamento encontrado</div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aluno</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{p.students?.name || "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{p.students?.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.product_name || p.courses?.title || "—"}</td>
                  <td className="px-4 py-3 font-mono text-foreground">{formatCurrency(Number(p.amount))}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={statusColors[p.status] || ""}>{statusLabels[p.status] || p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.purchased_at || p.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setSelectedPayload(JSON.stringify(p.raw_payload, null, 2))}><Eye className="h-3.5 w-3.5" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg bg-card border-border">
                          <DialogHeader><DialogTitle>Detalhes do Pagamento</DialogTitle></DialogHeader>
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div><span className="text-muted-foreground">ID Externo:</span> <span className="font-mono text-xs">{p.external_payment_id || "—"}</span></div>
                              <div><span className="text-muted-foreground">Order ID:</span> <span className="font-mono text-xs">{p.external_order_id || "—"}</span></div>
                              <div><span className="text-muted-foreground">Método:</span> {p.payment_method || "—"}</div>
                              <div><span className="text-muted-foreground">Parcelas:</span> {p.installments || 1}x</div>
                              <div><span className="text-muted-foreground">Cupom:</span> {p.coupon_code || "—"}</div>
                              <div><span className="text-muted-foreground">Afiliado:</span> {p.affiliate_name || "—"}</div>
                            </div>
                            {p.notes && <div><span className="text-muted-foreground">Observações:</span> {p.notes}</div>}
                            {p.raw_payload && (
                              <div>
                                <span className="text-muted-foreground">Payload bruto:</span>
                                <pre className="mt-1 p-3 bg-background rounded text-xs font-mono overflow-auto max-h-60">{JSON.stringify(p.raw_payload, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
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
