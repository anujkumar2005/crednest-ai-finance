import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export default function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState("1");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const handleSend = async (message: string) => {
    if (!message.trim() || !activeSession || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    // Update session with user message
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...s.messages, userMessage],
              title: s.messages.length === 0 ? message.slice(0, 30) + "..." : s.title,
            }
          : s
      )
    );
    setInput("");
    setIsTyping(true);

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
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast({
            title: "Rate limited",
            description: "Please wait a moment and try again.",
            variant: "destructive",
          });
        } else if (resp.status === 402) {
          toast({
            title: "Credits required",
            description: "Please add credits to continue using AI features.",
            variant: "destructive",
          });
        } else {
          throw new Error("Failed to get AI response");
        }
        setIsTyping(false);
        return;
      }

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

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const deleteSession = (sessionId: string) => {
    if (sessions.length === 1) {
      createNewSession();
    }
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(sessions[0]?.id || "1");
    }
  };

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
            {activeSession?.messages.length === 0 ? (
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
                      <div
                        className="prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: message.content
                            .replace(/\n/g, "<br>")
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/## (.*?)(<br>|$)/g, "<h3>$1</h3>")
                            .replace(/### (.*?)(<br>|$)/g, "<h4>$1</h4>")
                            .replace(/- (.*?)(<br>|$)/g, "• $1<br>")
                            .replace(/\|(.*?)\|/g, "<span>$1</span>"),
                        }}
                      />
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