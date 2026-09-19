import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, ExternalLink, FileText, Folder, FolderPlus, HardDrive, Image, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { PACK_FORMATS, type PackFormat } from "@/lib/pack-formats";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type Collection = Tables<"pack_collections">;
type PackItem = Tables<"pack_items">;
type Product = Pick<Tables<"courses">, "id" | "title" | "product_type" | "pack_format">;
type DriveFile = { id: string; name: string; mimeType: string; size?: string; modifiedTime?: string; thumbnailLink?: string; iconLink?: string };

const EMPTY_COLLECTION = { title: "", description: "" };

export default function PackContentPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [items, setItems] = useState<PackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveFolderId, setDriveFolderId] = useState("root");
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<Set<string>>(new Set());
  const [driveCollectionId, setDriveCollectionId] = useState("none");
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editingItem, setEditingItem] = useState<PackItem | null>(null);
  const [collectionForm, setCollectionForm] = useState(EMPTY_COLLECTION);
  const [itemForm, setItemForm] = useState({
    title: "", description: "", cover_url: "", collection_id: "none", status: "draft",
    canva_template_url: "", textual_content: "", textual_example: "",
  });

  const format = product?.pack_format as PackFormat | null | undefined;

  const loadData = async () => {
    if (!courseId) return;
    setLoading(true);
    const [productResult, collectionsResult, itemsResult] = await Promise.all([
      supabase.from("courses").select("id, title, product_type, pack_format").eq("id", courseId).single(),
      supabase.from("pack_collections").select("*").eq("course_id", courseId).order("sort_order"),
      supabase.from("pack_items").select("*").eq("course_id", courseId).order("sort_order"),
    ]);
    if (productResult.error || !productResult.data || productResult.data.product_type !== "pack") {
      toast.error("Pack não encontrado");
      navigate("/admin/courses");
      return;
    }
    setProduct(productResult.data);
    setCollections(collectionsResult.data ?? []);
    setItems(itemsResult.data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [courseId]);

  const groupedItems = useMemo(() => {
    const groups = new Map<string, PackItem[]>();
    items.forEach((item) => {
      const key = item.collection_id ?? "unfiled";
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });
    return groups;
  }, [items]);

  const openCollection = (collection?: Collection) => {
    setEditingCollection(collection ?? null);
    setCollectionForm(collection ? { title: collection.title, description: collection.description ?? "" } : EMPTY_COLLECTION);
    setCollectionOpen(true);
  };

  const saveCollection = async () => {
    if (!courseId || !collectionForm.title.trim()) return toast.error("Informe o nome da coleção");
    const values = { title: collectionForm.title.trim(), description: collectionForm.description.trim() || null };
    const result = editingCollection
      ? await supabase.from("pack_collections").update(values).eq("id", editingCollection.id)
      : await supabase.from("pack_collections").insert({ ...values, course_id: courseId, sort_order: collections.length });
    if (result.error) return toast.error(result.error.message);
    toast.success(editingCollection ? "Coleção atualizada" : "Coleção criada");
    setCollectionOpen(false);
    loadData();
  };

  const deleteCollection = async (collection: Collection) => {
    if (!confirm(`Excluir a coleção “${collection.title}”? Os itens ficarão sem coleção.`)) return;
    const { error } = await supabase.from("pack_collections").delete().eq("id", collection.id);
    if (error) return toast.error(error.message);
    toast.success("Coleção excluída");
    loadData();
  };

  const openItem = (item?: PackItem, collectionId?: string) => {
    setEditingItem(item ?? null);
    setItemForm(item ? {
      title: item.title,
      description: item.description ?? "",
      cover_url: item.cover_url ?? "",
      collection_id: item.collection_id ?? "none",
      status: item.status,
      canva_template_url: item.canva_template_url ?? "",
      textual_content: item.textual_content ?? "",
      textual_example: item.textual_example ?? "",
    } : {
      title: "", description: "", cover_url: "", collection_id: collectionId ?? "none", status: "draft",
      canva_template_url: "", textual_content: "", textual_example: "",
    });
    setItemOpen(true);
  };

  const saveItem = async () => {
    if (!courseId || !format || !itemForm.title.trim()) return toast.error("Informe o título do item");
    if (format === "canva" && !itemForm.canva_template_url.trim()) return toast.error("Informe o link do template do Canva");
    if (format === "textual" && !itemForm.textual_content.trim()) return toast.error("Informe o conteúdo textual");
    const values: TablesInsert<"pack_items"> = {
      course_id: courseId,
      collection_id: itemForm.collection_id === "none" ? null : itemForm.collection_id,
      format,
      title: itemForm.title.trim(),
      description: itemForm.description.trim() || null,
      cover_url: itemForm.cover_url.trim() || null,
      status: itemForm.status as TablesInsert<"pack_items">["status"],
      canva_template_url: format === "canva" ? itemForm.canva_template_url.trim() : null,
      textual_content: format === "textual" ? itemForm.textual_content.trim() : null,
      textual_example: format === "textual" ? itemForm.textual_example.trim() || null : null,
      sort_order: editingItem?.sort_order ?? items.length,
    };
    const result = editingItem
      ? await supabase.from("pack_items").update(values).eq("id", editingItem.id)
      : await supabase.from("pack_items").insert(values);
    if (result.error) return toast.error(result.error.message);
    toast.success(editingItem ? "Item atualizado" : "Item criado");
    setItemOpen(false);
    loadData();
  };

  const deleteItem = async (item: PackItem) => {
    if (!confirm(`Excluir “${item.title}”?`)) return;
    const { error } = await supabase.from("pack_items").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Item excluído");
    loadData();
  };

  const invokeDrive = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("pack-drive", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const loadDriveFolder = async (folderId = "root") => {
    setDriveLoading(true);
    try {
      const data = await invokeDrive({ action: "list", folder_id: folderId });
      setDriveFiles(data.files ?? []);
      setDriveFolderId(folderId);
      setSelectedDriveFiles(new Set());
      setDriveOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir o Google Drive");
    } finally {
      setDriveLoading(false);
    }
  };

  const importDriveFiles = async () => {
    if (!courseId || selectedDriveFiles.size === 0) return toast.error("Selecione pelo menos um arquivo");
    setDriveLoading(true);
    try {
      await invokeDrive({ action: "import", course_id: courseId, collection_id: driveCollectionId === "none" ? null : driveCollectionId, file_ids: [...selectedDriveFiles] });
      toast.success("Arquivos importados");
      setDriveOpen(false);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar arquivos");
    } finally {
      setDriveLoading(false);
    }
  };

  const syncDrive = async () => {
    if (!courseId) return;
    setDriveLoading(true);
    try {
      await invokeDrive({ action: "sync", course_id: courseId });
      toast.success("Biblioteca sincronizada");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao sincronizar a biblioteca");
    } finally {
      setDriveLoading(false);
    }
  };

  if (loading || !product || !format) return <div className="flex justify-center py-16"><div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" /></div>;

  const renderItems = (collectionItems: PackItem[], collectionId?: string) => (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {collectionItems.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-lg border border-border bg-card">
          {(item.cover_url || format === "canva") && <div className="flex aspect-[16/10] items-center justify-center overflow-hidden bg-muted/30">
            {item.cover_url ? <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" /> : <Image className="h-8 w-8 text-muted-foreground" />}
          </div>}
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-medium">{item.title}</p><Badge variant="outline" className="mt-1 text-[10px]">{item.status === "published" ? "Publicado" : item.status === "hidden" ? "Oculto" : "Rascunho"}</Badge></div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openItem(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteItem(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            {item.description && <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
            {format === "canva" && item.canva_template_url && <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => window.open(item.canva_template_url ?? "", "_blank")}><ExternalLink className="h-3.5 w-3.5" />Ver template</Button>}
            {format === "textual" && <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => navigator.clipboard.writeText(item.textual_content ?? "")}><Copy className="h-3.5 w-3.5" />Copiar texto</Button>}
            {format === "drive" && <Button variant="outline" size="sm" className="w-full gap-2" onClick={async () => {
              try {
                const { data, error } = await supabase.functions.invoke("pack-drive", { body: { action: "download", item_id: item.id } });
                if (error) throw error;
                const blob = data instanceof Blob ? data : new Blob([data]);
                window.open(URL.createObjectURL(blob), "_blank");
              } catch { toast.error("Não foi possível abrir o arquivo"); }
            }} disabled={!item.drive_available}><ExternalLink className="h-3.5 w-3.5" />{item.drive_available ? "Abrir arquivo" : "Indisponível"}</Button>}
          </div>
        </div>
      ))}
      <Button variant="outline" className="min-h-36 border-dashed" onClick={() => openItem(undefined, collectionId)}><Plus className="mr-2 h-4 w-4" />Novo item</Button>
    </div>
  );

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to={`/admin/courses/${courseId}`}><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">{product.title}</h1><Badge variant="outline">{PACK_FORMATS[format].label}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Conteúdo e coleções do Pack</p></div>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => openCollection()}><FolderPlus className="h-4 w-4" />Nova coleção</Button>
      </div>

      {format === "drive" && <div className="flex items-center justify-between gap-5 rounded-lg border border-border bg-muted/20 p-5"><div><p className="text-sm font-medium">Biblioteca do Google Drive</p><p className="mt-1 text-xs text-muted-foreground">Selecione arquivos da conta da empresa e sincronize alterações quando precisar.</p></div><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" className="gap-2" onClick={syncDrive} disabled={driveLoading || items.length === 0}><RefreshCw className={`h-3.5 w-3.5 ${driveLoading ? "animate-spin" : ""}`} />Sincronizar agora</Button><Button size="sm" className="gap-2" onClick={() => loadDriveFolder()} disabled={driveLoading}><HardDrive className="h-3.5 w-3.5" />Selecionar arquivos</Button></div></div>}

      {collections.length === 0 && items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center"><FileText className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-4 text-sm font-medium">Este Pack ainda não tem conteúdo</p><p className="mt-1 text-xs text-muted-foreground">Crie uma coleção ou adicione o primeiro item.</p><div className="mt-5 flex justify-center gap-2"><Button variant="outline" onClick={() => openCollection()}>Nova coleção</Button>{format !== "drive" && <Button onClick={() => openItem()}>Novo item</Button>}</div></div>
      ) : <div className="space-y-8">
        {collections.map((collection) => <section key={collection.id} className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3"><div><h2 className="font-medium">{collection.title}</h2>{collection.description && <p className="mt-1 text-xs text-muted-foreground">{collection.description}</p>}</div><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => openCollection(collection)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => deleteCollection(collection)}><Trash2 className="h-4 w-4" /></Button></div></div>
          {renderItems(groupedItems.get(collection.id) ?? [], collection.id)}
        </section>)}
        {(groupedItems.get("unfiled")?.length ?? 0) > 0 && <section className="space-y-4"><h2 className="border-b border-border pb-3 font-medium">Sem coleção</h2>{renderItems(groupedItems.get("unfiled") ?? [])}</section>}
        {format !== "drive" && collections.length > 0 && <Button variant="outline" onClick={() => openItem()}><Plus className="mr-2 h-4 w-4" />Novo item sem coleção</Button>}
      </div>}

      <Dialog open={collectionOpen} onOpenChange={setCollectionOpen}><DialogContent><DialogHeader><DialogTitle>{editingCollection ? "Editar coleção" : "Nova coleção"}</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Nome</Label><Input value={collectionForm.title} onChange={(event) => setCollectionForm((current) => ({ ...current, title: event.target.value }))} /></div><div className="space-y-2"><Label>Descrição</Label><Textarea value={collectionForm.description} onChange={(event) => setCollectionForm((current) => ({ ...current, description: event.target.value }))} /></div></div><DialogFooter><Button variant="outline" onClick={() => setCollectionOpen(false)}>Cancelar</Button><Button onClick={saveCollection}>Salvar</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editingItem ? "Editar item" : `Novo item ${PACK_FORMATS[format].label}`}</DialogTitle></DialogHeader><div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1"><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Título</Label><Input value={itemForm.title} onChange={(event) => setItemForm((current) => ({ ...current, title: event.target.value }))} /></div><div className="space-y-2"><Label>Coleção</Label><Select value={itemForm.collection_id} onValueChange={(value) => setItemForm((current) => ({ ...current, collection_id: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sem coleção</SelectItem>{collections.map((collection) => <SelectItem key={collection.id} value={collection.id}>{collection.title}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label>Descrição</Label><Textarea value={itemForm.description} onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))} /></div><div className="space-y-2"><Label>URL da capa</Label><Input type="url" value={itemForm.cover_url} onChange={(event) => setItemForm((current) => ({ ...current, cover_url: event.target.value }))} placeholder="https://..." /></div>{format === "canva" && <div className="space-y-2"><Label>Link de duplicação do Canva</Label><Input type="url" value={itemForm.canva_template_url} onChange={(event) => setItemForm((current) => ({ ...current, canva_template_url: event.target.value }))} placeholder="https://www.canva.com/design/..." /></div>}{format === "textual" && <><div className="space-y-2"><Label>Conteúdo</Label><Textarea rows={12} value={itemForm.textual_content} onChange={(event) => setItemForm((current) => ({ ...current, textual_content: event.target.value }))} /></div><div className="space-y-2"><Label>Exemplo ou orientação adicional</Label><Textarea rows={4} value={itemForm.textual_example} onChange={(event) => setItemForm((current) => ({ ...current, textual_example: event.target.value }))} /></div></>}<div className="space-y-2"><Label>Estado</Label><Select value={itemForm.status} onValueChange={(value) => setItemForm((current) => ({ ...current, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Rascunho</SelectItem><SelectItem value="published">Publicado</SelectItem><SelectItem value="hidden">Oculto</SelectItem></SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() => setItemOpen(false)}>Cancelar</Button><Button onClick={saveItem}>Salvar item</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={driveOpen} onOpenChange={setDriveOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Selecionar arquivos do Google Drive</DialogTitle></DialogHeader><div className="space-y-4"><div className="flex items-center justify-between gap-4"><Select value={driveCollectionId} onValueChange={setDriveCollectionId}><SelectTrigger className="w-64"><SelectValue placeholder="Coleção de destino" /></SelectTrigger><SelectContent><SelectItem value="none">Sem coleção</SelectItem>{collections.map((collection) => <SelectItem key={collection.id} value={collection.id}>{collection.title}</SelectItem>)}</SelectContent></Select>{driveFolderId !== "root" && <Button variant="outline" size="sm" onClick={() => loadDriveFolder("root")}>Voltar ao início</Button>}</div><div className="max-h-[55vh] divide-y divide-border overflow-y-auto rounded-lg border border-border">{driveFiles.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Nenhum arquivo encontrado nesta pasta</p> : driveFiles.map((file) => {
        const isFolder = file.mimeType === "application/vnd.google-apps.folder";
        return <div key={file.id} className="flex items-center gap-3 p-3">{isFolder ? <Folder className="h-5 w-5 text-muted-foreground" /> : <Checkbox checked={selectedDriveFiles.has(file.id)} onCheckedChange={(checked) => setSelectedDriveFiles((current) => { const next = new Set(current); if (checked) next.add(file.id); else next.delete(file.id); return next; })} />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="truncate text-xs text-muted-foreground">{isFolder ? "Pasta" : file.mimeType}</p></div>{isFolder && <Button variant="ghost" size="sm" onClick={() => loadDriveFolder(file.id)}>Abrir</Button>}</div>;
      })}</div></div><DialogFooter><Button variant="outline" onClick={() => setDriveOpen(false)}>Cancelar</Button><Button onClick={importDriveFiles} disabled={driveLoading || selectedDriveFiles.size === 0}>{driveLoading ? "Importando..." : `Importar ${selectedDriveFiles.size || ""}`}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}