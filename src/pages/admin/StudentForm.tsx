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
import CoverUpload from "@/components/CoverUpload";

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
    avatar_url: "",
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/students")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{isEdit ? "Editar Aluno" : "Novo Aluno"}</h1>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/students")}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : isEdit ? "Salvar" : "Criar Aluno"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-8">
        <CoverUpload
          value={form.avatar_url || ""}
          onChange={(url) => update("avatar_url", url)}
          storagePath={`avatars/students/${id || "new"}`}
          label="Avatar"
          aspectRatio="aspect-square"
          hint="Foto do aluno. Formato quadrado."
        />

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Nome *</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} className="bg-background border-border" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="bg-background border-border" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Telefone</Label>
              <Input value={form.phone || ""} onChange={(e) => update("phone", e.target.value)} placeholder="+55 11 99999-9999" className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">CPF</Label>
              <Input value={form.cpf || ""} onChange={(e) => update("cpf", e.target.value)} placeholder="000.000.000-00" className="bg-background border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Status</Label>
              <Select value={form.status || "active"} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Origem</Label>
              <Input value={form.origin || ""} onChange={(e) => update("origin", e.target.value)} placeholder="Ex: Ticto, Manual" className="bg-background border-border" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
