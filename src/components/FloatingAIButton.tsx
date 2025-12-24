import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isOpen) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isOpen) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  // Handle drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragStart.y));
      setPosition({ x: newX, y: newY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const newX = Math.max(0, Math.min(window.innerWidth - 60, touch.clientX - dragStart.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, touch.clientY - dragStart.y));
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
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Navigate to full chat with the message
    navigate("/chat", { state: { initialMessage: input.trim() } });
    setInput("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        ref={buttonRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        className={`fixed z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center transition-transform hover:scale-110 cursor-grab active:cursor-grabbing ${
          isDragging ? "scale-110" : ""
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
          className="fixed z-40 w-80 h-96 shadow-xl border border-border bg-background flex flex-col overflow-hidden"
          style={{
            right: `${position.x}px`,
            bottom: `${position.y + 70}px`,
          }}
        >
          {/* Header */}
          <div className="p-3 border-b border-border bg-card">
            <h3 className="font-semibold text-sm">Ask AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Quick question? Type below</p>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Type your question and hit send to go to full chat</p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground ml-8"
                        : "bg-muted mr-8"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-3 border-t border-border bg-card">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
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
