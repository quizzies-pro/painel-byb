import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, ArrowLeft, Circle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  student_id: string;
  lesson_id: string;
  course_id: string;
  student_name: string;
  student_email: string;
  lesson_title: string;
  course_title: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
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

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

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

    // Get unique student and lesson IDs
    const studentIds = [...new Set(rawMessages.map((m) => m.student_id))];
    const lessonIds = [...new Set(rawMessages.map((m) => m.lesson_id))];
    const courseIds = [...new Set(rawMessages.map((m) => m.course_id))];

    const [studentsRes, lessonsRes, coursesRes] = await Promise.all([
      supabase.from("students").select("id, name, email").in("id", studentIds),
      supabase.from("lessons").select("id, title").in("id", lessonIds),
      supabase.from("courses").select("id, title").in("id", courseIds),
    ]);

    const studentsMap = Object.fromEntries((studentsRes.data ?? []).map((s) => [s.id, s]));
    const lessonsMap = Object.fromEntries((lessonsRes.data ?? []).map((l) => [l.id, l]));
    const coursesMap = Object.fromEntries((coursesRes.data ?? []).map((c) => [c.id, c]));

    // Group by student_id + lesson_id
    const groups = new Map<string, Message[]>();
    for (const msg of rawMessages) {
      const key = `${msg.student_id}::${msg.lesson_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(msg);
    }

    const convos: Conversation[] = [];
    for (const [, msgs] of groups) {
      const first = msgs[0];
      const student = studentsMap[first.student_id];
      const lesson = lessonsMap[first.lesson_id];
      const course = coursesMap[first.course_id];
      const unread = msgs.filter((m) => !m.is_read && m.sender_type === "student").length;

      convos.push({
        student_id: first.student_id,
        lesson_id: first.lesson_id,
        course_id: first.course_id,
        student_name: student?.name ?? "Aluno desconhecido",
        student_email: student?.email ?? "",
        lesson_title: lesson?.title ?? "Aula desconhecida",
        course_title: course?.title ?? "Produto desconhecido",
        last_message: first.message,
        last_message_at: first.created_at,
        unread_count: unread,
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

    // Mark student messages as read
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

  useEffect(() => {
    fetchConversations();
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  if (loading && conversations.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedConvo && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedConvo(null)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mensagens</h1>
            <p className="text-xs text-muted-foreground">
              {selectedConvo
                ? `${selectedConvo.student_name} · ${selectedConvo.lesson_title}`
                : `${conversations.length} conversa${conversations.length !== 1 ? "s" : ""}${totalUnread > 0 ? ` · ${totalUnread} não lida${totalUnread !== 1 ? "s" : ""}` : ""}`}
            </p>
          </div>
        </div>
      </div>

      {!selectedConvo ? (
        // Conversation list
        conversations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-16 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma mensagem recebida ainda</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {conversations.map((convo) => (
              <button
                key={`${convo.student_id}::${convo.lesson_id}`}
                onClick={() => openConversation(convo)}
                className="w-full text-left px-4 py-3.5 hover:bg-muted/30 transition-colors flex items-start gap-3"
              >
                <div className="mt-1">
                  {convo.unread_count > 0 ? (
                    <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
                  ) : (
                    <Circle className="h-2.5 w-2.5 text-transparent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${convo.unread_count > 0 ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>
                      {convo.student_name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(convo.last_message_at), "dd MMM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">{convo.course_title}</Badge>
                    <span className="text-xs text-muted-foreground truncate">· {convo.lesson_title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{convo.last_message}</p>
                </div>
                {convo.unread_count > 0 && (
                  <Badge className="shrink-0 text-[10px] h-5 min-w-5 flex items-center justify-center">{convo.unread_count}</Badge>
                )}
              </button>
            ))}
          </div>
        )
      ) : (
        // Conversation detail
        <div className="border border-border rounded-lg flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
          <div className="border-b border-border px-4 py-3 bg-muted/20">
            <p className="text-sm font-medium">{selectedConvo.student_name}</p>
            <p className="text-xs text-muted-foreground">{selectedConvo.student_email} · {selectedConvo.course_title} · {selectedConvo.lesson_title}</p>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-lg px-3.5 py-2.5 ${
                    msg.sender_type === "admin"
                      ? "bg-foreground text-background"
                      : "bg-muted/50 text-foreground border border-border"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_type === "admin" ? "text-background/60" : "text-muted-foreground"}`}>
                      {format(new Date(msg.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t border-border p-3 flex gap-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Escreva sua resposta..."
              className="bg-background border-border resize-none min-h-[44px] max-h-[120px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendReply();
                }
              }}
            />
            <Button size="icon" onClick={handleSendReply} disabled={sending || !reply.trim()} className="shrink-0 h-[44px] w-[44px]">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
