import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function driveRequest(path: string) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const driveKey = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!lovableKey || !driveKey) throw new Error("A conexão com o Google Drive não está disponível");
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": driveKey },
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google Drive [${response.status}]: ${details}`);
  }
  return response;
}

async function listDriveFolder(folderId: string) {
  const files: unknown[] = [];
  let pageToken = "";
  do {
    const query = encodeURIComponent(`'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`);
    const fields = encodeURIComponent("files(id,name,mimeType,size,modifiedTime,thumbnailLink,iconLink,parents),nextPageToken");
    const page = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
    const response = await driveRequest(`/files?q=${query}&fields=${fields}&pageSize=1000&orderBy=folder,name${page}`);
    const payload = await response.json();
    files.push(...(Array.isArray(payload.files) ? payload.files : []));
    pageToken = typeof payload.nextPageToken === "string" ? payload.nextPageToken : "";
  } while (pageToken);
  return files;
}

async function isInsideFolder(folderId: string, rootFolderId: string) {
  if (folderId === rootFolderId) return true;
  let currentId = folderId;
  for (let depth = 0; depth < 20; depth += 1) {
    const fields = encodeURIComponent("id,parents,trashed");
    const response = await driveRequest(`/files/${encodeURIComponent(currentId)}?fields=${fields}`);
    const folder = await response.json();
    if (folder.trashed || !Array.isArray(folder.parents) || folder.parents.length === 0) return false;
    if (folder.parents.includes(rootFolderId)) return true;
    currentId = folder.parents[0];
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "Serviço indisponível" }, 500);
    const admin = createClient(supabaseUrl, serviceKey);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Não autorizado" }, 401);

    const body = req.method === "POST" ? await req.json() : {};
    const action = body.action as string;
    const { data: role } = await admin.from("user_roles").select("role, permissions").eq("user_id", user.id).maybeSingle();
    const permissions = role?.permissions as { courses?: { manage?: boolean } } | null;
    const isAdmin = role?.role === "super_admin" || Boolean(permissions?.courses?.manage);

    if (action === "list") {
      if (!isAdmin) return json({ error: "Sem permissão para acessar a biblioteca" }, 403);
      const courseId = typeof body.course_id === "string" ? body.course_id : "";
      const { data: course } = await admin.from("courses").select("pack_format, drive_root_folder_id").eq("id", courseId).single();
      if (course?.pack_format !== "drive") return json({ error: "Este produto não é um Pack do Google Drive" }, 400);
      if (!course.drive_root_folder_id) return json({ error: "Escolha primeiro a pasta principal deste Pack" }, 400);
      const folderId = typeof body.folder_id === "string" && body.folder_id ? body.folder_id : course.drive_root_folder_id;
      if (!(await isInsideFolder(folderId, course.drive_root_folder_id))) return json({ error: "Esta pasta está fora da biblioteca configurada" }, 403);
      return json({ files: await listDriveFolder(folderId), root_folder_id: course.drive_root_folder_id });
    }

    if (action === "browse-folders") {
      if (!isAdmin) return json({ error: "Sem permissão para configurar a biblioteca" }, 403);
      const folderId = typeof body.folder_id === "string" && body.folder_id ? body.folder_id : "root";
      const files = await listDriveFolder(folderId);
      return json({ files: files.filter((file: any) => file.mimeType === "application/vnd.google-apps.folder") });
    }

    if (action === "set-root") {
      if (!isAdmin) return json({ error: "Sem permissão para configurar a biblioteca" }, 403);
      const courseId = typeof body.course_id === "string" ? body.course_id : "";
      const folderId = typeof body.folder_id === "string" ? body.folder_id : "";
      if (!courseId || !folderId || folderId === "root") return json({ error: "Selecione uma pasta exclusiva para este Pack" }, 400);
      const fields = encodeURIComponent("id,name,mimeType,trashed");
      const response = await driveRequest(`/files/${encodeURIComponent(folderId)}?fields=${fields}`);
      const folder = await response.json();
      if (folder.trashed || folder.mimeType !== "application/vnd.google-apps.folder") return json({ error: "A pasta selecionada não está disponível" }, 400);
      const { data: course } = await admin.from("courses").select("pack_format").eq("id", courseId).single();
      if (course?.pack_format !== "drive") return json({ error: "Este produto não é um Pack do Google Drive" }, 400);
      const { error } = await admin.from("courses").update({ drive_root_folder_id: folder.id, drive_root_folder_name: folder.name }).eq("id", courseId);
      if (error) throw error;
      return json({ success: true, folder: { id: folder.id, name: folder.name } });
    }

    if (action === "import") {
      if (!isAdmin) return json({ error: "Sem permissão para importar arquivos" }, 403);
      const courseId = typeof body.course_id === "string" ? body.course_id : "";
      const collectionId = typeof body.collection_id === "string" ? body.collection_id : null;
      const fileIds = Array.isArray(body.file_ids) ? body.file_ids.filter((id: unknown) => typeof id === "string") : [];
      if (!courseId || fileIds.length === 0) return json({ error: "Selecione pelo menos um arquivo" }, 400);
      const { data: course } = await admin.from("courses").select("pack_format, drive_root_folder_id").eq("id", courseId).single();
      if (course?.pack_format !== "drive") return json({ error: "Este produto não é um Pack do Google Drive" }, 400);
      if (!course.drive_root_folder_id) return json({ error: "Escolha primeiro a pasta principal deste Pack" }, 400);

      for (let index = 0; index < fileIds.length; index += 1) {
        const fields = encodeURIComponent("id,name,mimeType,size,modifiedTime,thumbnailLink,iconLink,trashed,parents");
        const response = await driveRequest(`/files/${encodeURIComponent(fileIds[index])}?fields=${fields}`);
        const file = await response.json();
        if (file.trashed || file.mimeType === "application/vnd.google-apps.folder") continue;
        const parentId = Array.isArray(file.parents) ? file.parents[0] : "";
        if (!parentId || !(await isInsideFolder(parentId, course.drive_root_folder_id))) continue;
        const { error } = await admin.from("pack_items").upsert({
          course_id: courseId,
          collection_id: collectionId,
          format: "drive",
          title: file.name,
          status: "draft",
          sort_order: index,
          drive_file_id: file.id,
          drive_file_name: file.name,
          drive_mime_type: file.mimeType,
          drive_file_size: file.size ? Number(file.size) : null,
          drive_thumbnail_url: file.thumbnailLink ?? file.iconLink ?? null,
          drive_modified_at: file.modifiedTime ?? null,
          drive_synced_at: new Date().toISOString(),
          drive_available: true,
        }, { onConflict: "course_id,drive_file_id" });
        if (error) throw error;
      }
      return json({ success: true, imported: fileIds.length });
    }

    if (action === "sync") {
      if (!isAdmin) return json({ error: "Sem permissão para sincronizar arquivos" }, 403);
      const courseId = typeof body.course_id === "string" ? body.course_id : "";
      const { data: items, error } = await admin.from("pack_items").select("id, drive_file_id").eq("course_id", courseId).eq("format", "drive");
      if (error) throw error;
      let synced = 0;
      for (const item of items ?? []) {
        if (!item.drive_file_id) continue;
        try {
          const fields = encodeURIComponent("id,name,mimeType,size,modifiedTime,thumbnailLink,iconLink,trashed");
          const response = await driveRequest(`/files/${encodeURIComponent(item.drive_file_id)}?fields=${fields}`);
          const file = await response.json();
          await admin.from("pack_items").update({
            title: file.name,
            drive_file_name: file.name,
            drive_mime_type: file.mimeType,
            drive_file_size: file.size ? Number(file.size) : null,
            drive_thumbnail_url: file.thumbnailLink ?? file.iconLink ?? null,
            drive_modified_at: file.modifiedTime ?? null,
            drive_synced_at: new Date().toISOString(),
            drive_available: !file.trashed,
          }).eq("id", item.id);
          synced += 1;
        } catch {
          await admin.from("pack_items").update({ drive_available: false, drive_synced_at: new Date().toISOString() }).eq("id", item.id);
        }
      }
      return json({ success: true, synced });
    }

    if (action === "download") {
      const itemId = typeof body.item_id === "string" ? body.item_id : "";
      const { data: item } = await admin.from("pack_items").select("course_id, drive_file_id, drive_file_name, drive_mime_type, status, drive_available").eq("id", itemId).single();
      if (!item?.drive_file_id || !item.drive_available) return json({ error: "Arquivo indisponível" }, 404);
      if (!isAdmin) {
        const { data: student } = await admin.from("students").select("id").eq("auth_user_id", user.id).maybeSingle();
        if (!student) return json({ error: "Acesso não autorizado" }, 403);
        const { data: enrollment } = await admin.from("enrollments").select("id, expires_at").eq("student_id", student.id).eq("course_id", item.course_id).eq("status", "active").maybeSingle();
        if (!enrollment || (enrollment.expires_at && new Date(enrollment.expires_at) <= new Date())) return json({ error: "Matrícula inativa" }, 403);
        if (item.status !== "published") return json({ error: "Conteúdo indisponível" }, 403);
      }
      const nativeMime = item.drive_mime_type?.startsWith("application/vnd.google-apps.");
      const path = nativeMime
        ? `/files/${encodeURIComponent(item.drive_file_id)}/export?mimeType=${encodeURIComponent("application/pdf")}`
        : `/files/${encodeURIComponent(item.drive_file_id)}?alt=media`;
      const response = await driveRequest(path);
      return new Response(response.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": nativeMime ? "application/pdf" : item.drive_mime_type ?? "application/octet-stream",
          "Content-Disposition": `inline; filename="${(item.drive_file_name ?? "arquivo").replace(/["\r\n]/g, "")}"`,
        },
      });
    }

    return json({ error: "Ação inválida" }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao acessar o Google Drive";
    console.error(message);
    return json({ error: message }, 500);
  }
});