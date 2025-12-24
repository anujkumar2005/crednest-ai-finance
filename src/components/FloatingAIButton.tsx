import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    e.preventDefault();
    setIsDragging(true);
    setDragMoved(false);
    setDragStart({
      x: e.clientX - (window.innerWidth - position.x - 56),
      y: e.clientY - (window.innerHeight - position.y - 56),
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragMoved(false);
    setDragStart({
      x: touch.clientX - (window.innerWidth - position.x - 56),
      y: touch.clientY - (window.innerHeight - position.y - 56),
    });
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setDragMoved(true);
      const newX = Math.max(0, Math.min(window.innerWidth - 60, window.innerWidth - e.clientX + dragStart.x - 56));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, window.innerHeight - e.clientY + dragStart.y - 56));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      setDragMoved(true);
      const touch = e.touches[0];
      const newX = Math.max(0, Math.min(window.innerWidth - 60, window.innerWidth - touch.clientX + dragStart.x - 56));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, window.innerHeight - touch.clientY + dragStart.y - 56));
      setPosition({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, dragStart]);

  const handleClick = () => {
    // Only toggle if we didn't drag
    if (!dragMoved) {
      setIsOpen(!isOpen);
    }
    setDragMoved(false);
  };

  const streamChat = async (userMessage: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Please log in to use the AI assistant." 
      }]);
      return;
    }

    const allMessages = [...messages, { role: "user" as const, content: userMessage }];
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get AI response");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    // Add initial empty assistant message
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

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
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: assistantContent };
              return updated;
            });
          }
        } catch {
          // Incomplete JSON, put back and wait
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      await streamChat(userMessage);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExpandToFullChat = () => {
    navigate("/chat");
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        className={`fixed z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform hover:scale-110 ${
          isDragging ? "cursor-grabbing scale-110" : "cursor-grab"
        }`}
        style={{
          right: `${position.x}px`,
          bottom: `${position.y}px`,
        }}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <Card
          className="fixed z-40 w-80 sm:w-96 h-[28rem] shadow-xl border border-border bg-background flex flex-col overflow-hidden"
          style={{
            right: `${position.x}px`,
            bottom: `${position.y + 70}px`,
          }}
        >
          {/* Header */}
          <div className="p-3 border-b border-border bg-card flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">CredNest AI</h3>
              <p className="text-xs text-muted-foreground">Your financial assistant</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExpandToFullChat}
              className="h-8 w-8"
              title="Open full chat"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Ask me about loans, EMI, investments, or any finance topic!</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground ml-8"
                        : "bg-muted mr-4"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                ))
              )}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="p-2 rounded-lg text-sm bg-muted mr-4 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-border bg-card">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about finance..."
                className="flex-1 text-sm"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
