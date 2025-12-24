import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Send,
  Sparkles,
  Calculator,
  FileText,
  Lightbulb,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const quickActions = [
  {
    icon: Calculator,
    label: "Calculate EMI",
    prompt: "Help me calculate EMI for a home loan of ₹50 lakhs at 8.5% interest for 20 years",
  },
  {
    icon: FileText,
    label: "Loan Documents",
    prompt: "What documents do I need for a personal loan application?",
  },
  {
    icon: Lightbulb,
    label: "Savings Tips",
    prompt: "Give me 5 practical tips to save money on a monthly salary of ₹60,000",
  },
];

// Invoke the backend chat function via supabase.functions.invoke (supports streaming).

export default function Chat() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Load sessions from database
  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user?.id)
        .order("updated_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      if (sessionsData && sessionsData.length > 0) {
        // Load messages for all sessions
        const sessionsWithMessages: ChatSession[] = await Promise.all(
          sessionsData.map(async (session) => {
            const { data: messages } = await supabase
              .from("chat_messages")
              .select("*")
              .eq("session_id", session.id)
              .order("created_at", { ascending: true });

            return {
              id: session.id,
              title: session.title || "New Conversation",
              createdAt: new Date(session.created_at || ""),
              messages: (messages || []).map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
                timestamp: new Date(m.created_at || ""),
              })),
            };
          })
        );

        setSessions(sessionsWithMessages);
        setActiveSessionId(sessionsWithMessages[0].id);
      } else {
        // Create first session
        createNewSession();
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const saveMessage = async (sessionId: string, role: "user" | "assistant", content: string) => {
    try {
      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        user_id: user?.id,
        role,
        content,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      await supabase
        .from("chat_sessions")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    } catch (error) {
      console.error("Error updating session:", error);
    }
  };

  const handleSend = async (message: string) => {
    if (!message.trim() || !activeSession || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    // Update session title if first message
    const isFirstMessage = activeSession.messages.length === 0;
    const newTitle = isFirstMessage ? message.slice(0, 30) + "..." : activeSession.title;

    // Update session with user message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...s.messages, userMessage],
              title: newTitle,
            }
          : s
      )
    );
    setInput("");
    setIsTyping(true);

    // Save user message to database
    await saveMessage(activeSession.id, "user", message);
    if (isFirstMessage) {
      await updateSessionTitle(activeSession.id, newTitle);
    }

    // Build messages for API
    const apiMessages = [
      ...activeSession.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    let assistantContent = "";

    try {
      const invokeOnce = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          return {
            data: null,
            error: { context: { status: 401 } },
          } as any;
        }

        return supabase.functions.invoke("ai-chat", {
          body: { messages: apiMessages },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      };

      let { data, error } = await invokeOnce();

      // If the access token is expired, refresh once and retry.
      if (error && (error as any)?.context?.status === 401) {
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError) {
          ({ data, error } = await invokeOnce());
        }
      }

      if (error) {
        const status = (error as any)?.context?.status as number | undefined;

        if (status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please sign in again to use the AI assistant.",
            variant: "destructive",
          });
          return;
        }

        if (status === 429) {
          toast({
            title: "Rate limited",
            description: "Please wait a moment and try again.",
            variant: "destructive",
          });
          return;
        }

        if (status === 402) {
          toast({
            title: "Credits required",
            description: "Please add credits to continue using AI features.",
            variant: "destructive",
          });
          return;
        }

        throw error;
      }

      const resp = data as Response;

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let textBuffer = "";

      // Create assistant message placeholder
      const assistantMessageId = (Date.now() + 1).toString();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? {
                ...s,
                messages: [
                  ...s.messages,
                  {
                    id: assistantMessageId,
                    role: "assistant" as const,
                    content: "",
                    timestamp: new Date(),
                  },
                ],
              }
            : s
        )
      );

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              // Update assistant message
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === activeSessionId
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantMessageId
                            ? { ...m, content: assistantContent }
                            : m
                        ),
                      }
                    : s
                )
              );
            }
          } catch {
            // Incomplete JSON, put back and wait
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant message to database
      if (assistantContent) {
        await saveMessage(activeSession.id, "assistant", assistantContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const createNewSession = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user?.id,
          title: "New Conversation",
        })
        .select()
        .single();

      if (error) throw error;

      const newSession: ChatSession = {
        id: data.id,
        title: "New Conversation",
        messages: [],
        createdAt: new Date(data.created_at || ""),
      };

      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description: "Failed to create new chat session.",
        variant: "destructive",
      });
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      // Delete messages first
      await supabase.from("chat_messages").delete().eq("session_id", sessionId);
      // Delete session
      await supabase.from("chat_sessions").delete().eq("id", sessionId);

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          createNewSession();
        }
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Sidebar - Chat Sessions */}
        <Card className="hidden md:flex flex-col w-72 shrink-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Chats</CardTitle>
              <Button variant="ghost" size="icon" onClick={createNewSession}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2 pt-0">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                  session.id === activeSessionId
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-secondary"
                }`}
                onClick={() => setActiveSessionId(session.id)}
              >
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="flex-1 truncate text-sm">{session.title}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">CredNest AI Assistant</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your personal financial advisor powered by AI
                </p>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeSession || activeSession.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center mb-4 animate-pulse-glow">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  How can I help you today?
                </h3>
                <p className="text-muted-foreground max-w-md mb-8">
                  Ask me about loans, EMI calculations, financial planning, or get
                  personalized advice for your goals.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="glass"
                      className="gap-2"
                      onClick={() => handleSend(action.prompt)}
                    >
                      <action.icon className="h-4 w-4 text-primary" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {activeSession.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        message.role === "user"
                          ? "chat-bubble-user"
                          : "chat-bubble-ai"
                      }`}
                    >
                      <div className="prose prose-invert prose-sm max-w-none [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-sm [&>h4]:text-sm [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>table]:text-xs">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="chat-bubble-ai flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about loans, EMI, investments..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button type="submit" variant="gold" disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
