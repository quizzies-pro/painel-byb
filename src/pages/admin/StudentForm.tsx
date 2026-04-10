import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<TablesInsert<"students">>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    status: "active",
    origin: "",
  });

  useEffect(() => {
    if (id) {
      setLoading(true);
      supabase.from("students").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error || !data) { toast.error("Aluno não encontrado"); navigate("/admin/students"); }
        else setForm(data as unknown as TablesInsert<"students">);
        setLoading(false);
      });
    }
  }, [id, navigate]);

  const update = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { toast.error("Nome e email são obrigatórios"); return; }
    setSaving(true);
    if (isEdit) {
      const { error } = await supabase.from("students").update(form).eq("id", id!);
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Aluno atualizado"); navigate("/admin/students"); }
    } else {
      const { error } = await supabase.from("students").insert(form);
      if (error) toast.error("Erro: " + error.message);
      else { toast.success("Aluno criado"); navigate("/admin/students"); }
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/students")}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar Aluno" : "Novo Aluno"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 rounded-lg border border-border p-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dados Pessoais</h2>
          <div className="space-y-2">
            <Label className="text-sm">Nome *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} className="bg-card border-border" required />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="bg-card border-border" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Telefone</Label>
              <Input value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} placeholder="+55 11 99999-9999" className="bg-card border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">CPF</Label>
              <Input value={form.cpf || ""} onChange={(e) => update("cpf", e.target.value)} placeholder="000.000.000-00" className="bg-card border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Status</Label>
              <Select value={form.status || "active"} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Origem</Label>
              <Input value={form.origin || ""} onChange={(e) => update("origin", e.target.value)} placeholder="Ex: Ticto, Manual" className="bg-card border-border" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : isEdit ? "Salvar" : "Criar Aluno"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/students")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
