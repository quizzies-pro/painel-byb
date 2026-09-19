import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PRODUCT_TYPES } from "@/lib/product-types";

const waitlistSchema = z.object({
  course_id: z.string().uuid("Selecione um produto"),
  name: z.string().trim().min(2, "Informe um nome").max(160),
  description: z.string().trim().max(1000).optional(),
  consent_text: z.string().trim().min(20, "Detalhe o consentimento").max(2000),
  consent_version: z.string().trim().min(1).max(50),
  privacy_policy_url: z.string().trim().url("Informe uma URL válida").startsWith("https://", "Use uma URL HTTPS"),
});

type Course = Pick<Tables<"courses">, "id" | "title" | "available_for_sale" | "product_type">;

export default function WaitlistForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [form, setForm] = useState({ course_id: "", name: "", description: "", consent_text: "Autorizo o envio de novidades, conteúdos e ofertas deste produto por e-mail e WhatsApp.", consent_version: "1.0", privacy_policy_url: "https://membros.diveclube.com.br/politica-de-privacidade" });

  useEffect(() => {
    supabase.from("courses").select("id, title, available_for_sale, product_type").order("title").then(({ data }) => setCourses(data ?? []));
    if (id) supabase.from("product_waitlists").select("*").eq("id", id).single().then(({ data, error }) => {
      if (error || !data) { toast.error("Lista não encontrada"); navigate("/admin/waitlists"); return; }
      setForm({ course_id: data.course_id, name: data.name, description: data.description ?? "", consent_text: data.consent_text, consent_version: data.consent_version, privacy_policy_url: data.privacy_policy_url });
      setLoading(false);
    });
  }, [id, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = waitlistSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Revise os dados"); return; }
    const { course_id, name, description, consent_text, consent_version, privacy_policy_url } = parsed.data;
    if (!course_id || !name || !consent_text || !consent_version || !privacy_policy_url) { toast.error("Preencha todos os campos obrigatórios"); return; }
    const selectedCourse = courses.find((course) => course.id === course_id);
    if (selectedCourse?.available_for_sale) { toast.error("Este produto já está disponível para venda"); return; }
    setSaving(true);
    const payload = { course_id, name, consent_text, consent_version, privacy_policy_url, description: description || null };
    const result = id
      ? await supabase.from("product_waitlists").update(payload).eq("id", id)
      : await supabase.from("product_waitlists").insert(payload);
    setSaving(false);
    if (result.error) { toast.error(result.error.message); return; }
    toast.success(id ? "Lista atualizada" : "Lista criada");
    navigate("/admin/waitlists");
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  return <form onSubmit={submit} className="space-y-6">
    <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><Button type="button" variant="ghost" size="icon" onClick={() => navigate("/admin/waitlists")}><ArrowLeft /></Button><div><h1 className="text-2xl font-semibold">{id ? "Editar lista" : "Nova lista de espera"}</h1><p className="mt-1 text-sm text-muted-foreground">Vincule a campanha a um produto ainda não liberado.</p></div></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => navigate("/admin/waitlists")}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar lista"}</Button></div></div>
    <div className="max-w-2xl space-y-5">
      <div className="space-y-2"><Label>Produto *</Label><Select value={form.course_id} onValueChange={(value) => setForm((current) => ({ ...current, course_id: value }))}><SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger><SelectContent>{courses.map((course) => <SelectItem key={course.id} value={course.id} disabled={course.available_for_sale}>{course.title} · {PRODUCT_TYPES[course.product_type].label}{course.available_for_sale ? " — à venda" : ""}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="name">Nome interno *</Label><Input id="name" maxLength={160} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex.: Lançamento — Turma 2" /></div>
      <div className="space-y-2"><Label htmlFor="description">Descrição</Label><Textarea id="description" maxLength={1000} rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Contexto interno desta lista..." /></div>
      <div className="grid grid-cols-[1fr_140px] gap-4"><div className="space-y-2"><Label htmlFor="privacy">Política de privacidade *</Label><Input id="privacy" type="url" maxLength={2048} value={form.privacy_policy_url} onChange={(event) => setForm((current) => ({ ...current, privacy_policy_url: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="version">Versão *</Label><Input id="version" maxLength={50} value={form.consent_version} onChange={(event) => setForm((current) => ({ ...current, consent_version: event.target.value }))} /></div></div>
      <div className="space-y-2"><Label htmlFor="consent">Texto do consentimento *</Label><Textarea id="consent" maxLength={2000} rows={5} value={form.consent_text} onChange={(event) => setForm((current) => ({ ...current, consent_text: event.target.value }))} /><p className="text-xs text-muted-foreground">O aluno deverá aceitar este texto para receber comunicações por e-mail e WhatsApp.</p></div>
    </div>
  </form>;
}