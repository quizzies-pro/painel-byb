import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Send, Search, MessageSquare, Circle, Check, CheckCheck, Tag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ThreadStatus = "unresolved" | "resolved" | "awaiting_response";

interface Conversation {
  student_id: string;
  lesson_id: string;
  course_id: string;
  module_id: string;
  student_name: string;
  student_email: string;
  student_avatar: string | null;
  lesson_title: string;
  module_title: string;
  course_title: string;
  last_message: string;
  last_message_at: string;
  last_sender_type: string;
  last_message_read: boolean;
  unread_count: number;
  thread_status: ThreadStatus;
}

interface Message {
  id: string;
  student_id: string;
  lesson_id: string;
  course_id: string;
  message: string;
  sender_type: string;
  admin_id: string | null;
  is_read: boolean;
  created_at: string;
}

const STATUS_CONFIG: Record<ThreadStatus, { label: string; color: string; dotClass: string }> = {
  unresolved: { label: "Não resolvido", color: "bg-orange-500/15 text-orange-400 border-orange-500/20", dotClass: "bg-orange-400" },
  resolved: { label: "Resolvido", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", dotClass: "bg-emerald-400" },
  awaiting_response: { label: "Aguardando resposta", color: "bg-blue-500/15 text-blue-400 border-blue-500/20", dotClass: "bg-blue-400" },
};

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ThreadStatus | "all">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    const { data: rawMessages, error } = await supabase
      .from("lesson_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar mensagens");
      setLoading(false);
      return;
    }

    if (!rawMessages || rawMessages.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const studentIds = [...new Set(rawMessages.map((m) => m.student_id))];
    const lessonIds = [...new Set(rawMessages.map((m) => m.lesson_id))];
    const courseIds = [...new Set(rawMessages.map((m) => m.course_id))];

    const [studentsRes, lessonsRes, coursesRes, threadsRes] = await Promise.all([
      supabase.from("students").select("id, name, email, avatar_url").in("id", studentIds),
      supabase.from("lessons").select("id, title, module_id").in("id", lessonIds),
      supabase.from("courses").select("id, title").in("id", courseIds),
      supabase.from("message_threads").select("*"),
    ]);

    const studentsMap = Object.fromEntries((studentsRes.data ?? []).map((s) => [s.id, s]));
    const lessonsMap = Object.fromEntries((lessonsRes.data ?? []).map((l) => [l.id, l]));
    const coursesMap = Object.fromEntries((coursesRes.data ?? []).map((c) => [c.id, c]));
    const threadsMap = Object.fromEntries(
      (threadsRes.data ?? []).map((t: any) => [`${t.student_id}::${t.lesson_id}`, t])
    );

    const moduleIds = [...new Set((lessonsRes.data ?? []).map((l) => l.module_id).filter(Boolean))];
    const modulesRes = moduleIds.length > 0
      ? await supabase.from("course_modules").select("id, title").in("id", moduleIds)
      : { data: [] };
    const modulesMap = Object.fromEntries((modulesRes.data ?? []).map((m) => [m.id, m]));

    const groups = new Map<string, Message[]>();
    for (const msg of rawMessages) {
      const key = `${msg.student_id}::${msg.lesson_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(msg);
    }

    const convos: Conversation[] = [];
    for (const [key, msgs] of groups) {
      const first = msgs[0]; // most recent (ordered desc)
      const student = studentsMap[first.student_id];
      const lesson = lessonsMap[first.lesson_id];
      const course = coursesMap[first.course_id];
      const unread = msgs.filter((m) => !m.is_read && m.sender_type === "student").length;
      const moduleId = lesson?.module_id ?? "";
      const mod = moduleId ? modulesMap[moduleId] : null;
      const thread = threadsMap[key];

      convos.push({
        student_id: first.student_id,
        lesson_id: first.lesson_id,
        course_id: first.course_id,
        module_id: moduleId,
        student_name: student?.name ?? "Aluno desconhecido",
        student_email: student?.email ?? "",
        student_avatar: student?.avatar_url ?? null,
        lesson_title: lesson?.title ?? "Aula desconhecida",
        module_title: mod?.title ?? "Módulo desconhecido",
        course_title: course?.title ?? "Produto desconhecido",
        last_message: first.message,
        last_message_at: first.created_at,
        last_sender_type: first.sender_type,
        last_message_read: first.is_read,
        unread_count: unread,
        thread_status: thread?.status ?? "unresolved",
      });
    }

    convos.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setConversations(convos);
    setLoading(false);
  };

  const openConversation = async (convo: Conversation) => {
    setSelectedConvo(convo);
    const { data } = await supabase
      .from("lesson_messages")
      .select("*")
      .eq("student_id", convo.student_id)
      .eq("lesson_id", convo.lesson_id)
      .order("created_at", { ascending: true });

    setMessages(data ?? []);

    const unreadIds = (data ?? []).filter((m) => !m.is_read && m.sender_type === "student").map((m) => m.id);
    if (unreadIds.length > 0) {
      await supabase.from("lesson_messages").update({ is_read: true }).in("id", unreadIds);
      fetchConversations();
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedConvo) return;
    setSending(true);
    const { error } = await supabase.from("lesson_messages").insert({
      student_id: selectedConvo.student_id,
      lesson_id: selectedConvo.lesson_id,
      course_id: selectedConvo.course_id,
      message: reply.trim(),
      sender_type: "admin",
      admin_id: user?.id,
      is_read: false,
    });

    if (error) toast.error("Erro ao enviar resposta");
    else {
      setReply("");
      openConversation(selectedConvo);
    }
    setSending(false);
  };

  const updateThreadStatus = async (convo: Conversation, newStatus: ThreadStatus) => {
    const { error } = await supabase
      .from("message_threads")
      .upsert(
        {
          student_id: convo.student_id,
          lesson_id: convo.lesson_id,
          course_id: convo.course_id,
          status: newStatus,
          updated_by: user?.id,
        },
        { onConflict: "student_id,lesson_id" }
      );

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    toast.success(`Marcado como "${STATUS_CONFIG[newStatus].label}"`);

    // Update local state
    setConversations((prev) =>
      prev.map((c) =>
        c.student_id === convo.student_id && c.lesson_id === convo.lesson_id
          ? { ...c, thread_status: newStatus }
          : c
      )
    );
    if (selectedConvo?.student_id === convo.student_id && selectedConvo?.lesson_id === convo.lesson_id) {
      setSelectedConvo({ ...convo, thread_status: newStatus });
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const getTimeLabel = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} d`;
    const diffW = Math.floor(diffD / 7);
    return `${diffW} sem`;
  };

  // WhatsApp-style check marks for admin messages
  const ReadIndicator = ({ isRead }: { isRead: boolean }) => {
    if (isRead) {
      return <CheckCheck className="h-3.5 w-3.5 text-blue-400 inline-block ml-1" />;
    }
    return <Check className="h-3.5 w-3.5 text-muted-foreground inline-block ml-1" />;
  };

  const filtered = conversations.filter((c) => {
    const matchesSearch =
      c.student_name.toLowerCase().includes(search.toLowerCase()) ||
      c.lesson_title.toLowerCase().includes(search.toLowerCase()) ||
      c.course_title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.thread_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && conversations.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden flex" style={{ height: "calc(100vh - 120px)" }}>
      {/* Left sidebar - conversation list */}
      <div className="w-[340px] border-r border-border flex flex-col bg-background shrink-0">
        <div className="p-4 border-b border-border">
          <h1 className="text-base font-semibold tracking-tight mb-3">Mensagens</h1>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/30 border-border h-9 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {(["all", "unresolved", "awaiting_response", "resolved"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                  statusFilter === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground"
                }`}
              >
                {s === "all" ? "Todos" : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">Nenhuma conversa</p>
            </div>
          ) : (
            filtered.map((convo) => {
              const isSelected = selectedConvo?.student_id === convo.student_id && selectedConvo?.lesson_id === convo.lesson_id;
              const statusCfg = STATUS_CONFIG[convo.thread_status];
              return (
                <button
                  key={`${convo.student_id}::${convo.lesson_id}`}
                  onClick={() => openConversation(convo)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-muted/40 ${
                    isSelected ? "bg-muted/50" : ""
                  }`}
                >
                  <Avatar className="h-12 w-12 shrink-0 mt-0.5">
                    <AvatarImage src={convo.student_avatar ?? undefined} />
                    <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                      {getInitials(convo.student_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${convo.unread_count > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                        {convo.student_name}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {getTimeLabel(convo.last_message_at)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {convo.course_title} › {convo.module_title} › {convo.lesson_title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {convo.last_sender_type === "admin" && (
                        <span className="shrink-0">
                          {convo.last_message_read ? (
                            <CheckCheck className="h-3 w-3 text-blue-400" />
                          ) : (
                            <Check className="h-3 w-3 text-muted-foreground" />
                          )}
                        </span>
                      )}
                      <p className={`text-xs truncate ${convo.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {convo.last_message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border ${statusCfg.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotClass}`} />
                        {statusCfg.label}
                      </span>
                      {convo.unread_count > 0 && (
                        <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right side - chat area */}
      <div className="flex-1 flex flex-col bg-background">
        {!selectedConvo ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="h-20 w-20 rounded-full border-2 border-border flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-1">Suas mensagens</h2>
            <p className="text-sm text-muted-foreground">Selecione uma conversa para ver as mensagens</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="border-b border-border px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={selectedConvo.student_avatar ?? undefined} />
                  <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
                    {getInitials(selectedConvo.student_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedConvo.student_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {selectedConvo.course_title} › {selectedConvo.module_title} › {selectedConvo.lesson_title}
                  </p>
                </div>
              </div>

              {/* Status dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                    <Tag className="h-3 w-3" />
                    <span className={`inline-flex items-center gap-1`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[selectedConvo.thread_status].dotClass}`} />
                      {STATUS_CONFIG[selectedConvo.thread_status].label}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.keys(STATUS_CONFIG) as ThreadStatus[]).map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => updateThreadStatus(selectedConvo, s)}
                      className="text-xs gap-2"
                    >
                      <span className={`h-2 w-2 rounded-full ${STATUS_CONFIG[s].dotClass}`} />
                      {STATUS_CONFIG[s].label}
                      {selectedConvo.thread_status === s && <Check className="h-3 w-3 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                    {msg.sender_type === "student" && (
                      <Avatar className="h-7 w-7 mr-2 mt-1 shrink-0">
                        <AvatarImage src={selectedConvo.student_avatar ?? undefined} />
                        <AvatarFallback className="bg-muted text-[10px] font-medium">
                          {getInitials(selectedConvo.student_name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[60%] rounded-2xl px-4 py-2.5 ${
                      msg.sender_type === "admin"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-foreground"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                      <div className={`flex items-center justify-end gap-0.5 mt-1 ${msg.sender_type === "admin" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        <span className="text-[10px]">
                          {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
                        </span>
                        {msg.sender_type === "admin" && (
                          msg.is_read ? (
                            <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border p-4 flex items-end gap-2">
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Mensagem..."
                className="bg-muted/30 border-border resize-none min-h-[44px] max-h-[120px] rounded-xl"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleSendReply}
                disabled={sending || !reply.trim()}
                className="shrink-0 h-[44px] w-[44px] rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
