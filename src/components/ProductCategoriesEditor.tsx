import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Edit, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Category = Tables<"storefront_categories">;

export interface CategorySelection {
  categoryId: string;
  displayOrder: number;
}

interface ProductCategoriesEditorProps {
  value: CategorySelection[];
  onChange: (value: CategorySelection[]) => void;
}

const slugify = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ProductCategoriesEditor({ value, onChange }: ProductCategoriesEditorProps) {
  const confirmAction = useConfirmDialog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("storefront_categories")
      .select("*")
      .order("display_order")
      .order("name");
    if (error) toast.error("Erro ao carregar categorias");
    else setCategories(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setDescription(category.description ?? "");
    setIsActive(category.is_active);
    setDialogOpen(true);
  };

  const saveCategory = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error("Informe o nome da categoria");
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("storefront_categories").update({
        name: cleanName,
        description: description.trim() || null,
        is_active: isActive,
      }).eq("id", editing.id);
      if (error) toast.error("Erro ao atualizar categoria");
      else toast.success("Categoria atualizada");
    } else {
      const nextOrder = categories.reduce((highest, item) => Math.max(highest, item.display_order), -1) + 1;
      const baseSlug = slugify(cleanName) || "categoria";
      const { data, error } = await supabase.from("storefront_categories").insert({
        name: cleanName,
        description: description.trim() || null,
        is_active: isActive,
        display_order: nextOrder,
        slug: `${baseSlug}-${Date.now().toString(36)}`,
      }).select("*").single();
      if (error || !data) toast.error("Erro ao criar categoria");
      else {
        onChange([...value, { categoryId: data.id, displayOrder: 0 }]);
        toast.success("Categoria criada e selecionada");
      }
    }
    setSaving(false);
    setDialogOpen(false);
    fetchCategories();
  };

  const toggleCategory = (categoryId: string, checked: boolean) => {
    if (checked) {
      onChange([...value, { categoryId, displayOrder: 0 }]);
    } else {
      onChange(value.filter((item) => item.categoryId !== categoryId));
    }
  };

  const updateProductOrder = (categoryId: string, displayOrder: number) => {
    onChange(value.map((item) => item.categoryId === categoryId ? { ...item, displayOrder } : item));
  };

  const moveCategory = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const current = categories[index];
    const target = categories[targetIndex];
    const [{ error: currentError }, { error: targetError }] = await Promise.all([
      supabase.from("storefront_categories").update({ display_order: target.display_order }).eq("id", current.id),
      supabase.from("storefront_categories").update({ display_order: current.display_order }).eq("id", target.id),
    ]);
    if (currentError || targetError) toast.error("Erro ao alterar a ordem");
    else fetchCategories();
  };

  const deleteCategory = async (category: Category) => {
    if (!await confirmAction({ description: `Excluir a categoria “${category.name}”? Os produtos não serão excluídos.` })) return;
    const { error } = await supabase.from("storefront_categories").delete().eq("id", category.id);
    if (error) toast.error("Erro ao excluir categoria");
    else {
      onChange(value.filter((item) => item.categoryId !== category.id));
      toast.success("Categoria excluída");
      fetchCategories();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Label className="text-[13px] font-medium">Categorias de apresentação</Label>
          <p className="mt-1 text-xs text-muted-foreground">Somente produtos vinculados a uma categoria aparecem na página principal da Members.</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Nova categoria
        </Button>
      </div>

      {loading ? (
        <div className="h-20 animate-pulse rounded-md bg-muted" />
      ) : categories.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma categoria criada.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border bg-background">
          {categories.map((category, index) => {
            const selection = value.find((item) => item.categoryId === category.id);
            return (
              <div key={category.id} className="flex items-center gap-3 px-3 py-3">
                <Checkbox
                  checked={Boolean(selection)}
                  onCheckedChange={(checked) => toggleCategory(category.id, checked === true)}
                  aria-label={`Selecionar ${category.name}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{category.name}</span>
                    {!category.is_active && <span className="text-[10px] uppercase text-muted-foreground">Inativa</span>}
                  </div>
                  {category.description && <p className="truncate text-xs text-muted-foreground">{category.description}</p>}
                </div>
                {selection && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`order-${category.id}`} className="text-xs text-muted-foreground">Posição</Label>
                    <Input
                      id={`order-${category.id}`}
                      type="number"
                      min={0}
                      value={selection.displayOrder}
                      onChange={(event) => updateProductOrder(category.id, Number(event.target.value) || 0)}
                      className="h-8 w-16"
                    />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => moveCategory(index, -1)} title="Mover categoria para cima">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === categories.length - 1} onClick={() => moveCategory(index, 1)} title="Mover categoria para baixo">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(category)} title="Editar categoria">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteCategory(category)} title="Excluir categoria">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent size="default">
          <DialogHeader><DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle></DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome</Label>
              <Input id="category-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Comece por aqui" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Descrição</Label>
              <Textarea id="category-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Texto curto exibido abaixo do nome" rows={3} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <Label htmlFor="category-active">Categoria ativa</Label>
                <p className="text-xs text-muted-foreground">Categorias inativas não aparecem na Members.</p>
              </div>
              <Switch id="category-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={saveCategory} disabled={saving}>{saving ? "Salvando..." : "Salvar categoria"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}