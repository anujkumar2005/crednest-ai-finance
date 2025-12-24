import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Sparkles,
  Calculator,
  FileText,
  Lightbulb,
  Plus,
  Trash2,
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

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const handleSend = async (message: string) => {
    if (!message.trim() || !activeSession) return;

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

    // Simulate AI response - replace with actual Lovable AI integration
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getSimulatedResponse(message),
        timestamp: new Date(),
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages: [...s.messages, aiResponse] }
            : s
        )
      );
      setIsTyping(false);
    }, 1500);
  };

  const getSimulatedResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes("emi") || lowerQuery.includes("loan")) {
      return `## EMI Calculation Result 📊

Based on your query, here's the EMI calculation:

| Parameter | Value |
|-----------|-------|
| Principal Amount | ₹50,00,000 |
| Interest Rate | 8.5% p.a. |
| Loan Tenure | 20 years (240 months) |
| **Monthly EMI** | **₹43,391** |

### Breakdown:
- **Total Interest Payable**: ₹54,13,840
- **Total Amount Payable**: ₹1,04,13,840

### Tips to Reduce Your EMI:
1. Make a larger down payment to reduce principal
2. Compare rates across banks - even 0.5% difference can save lakhs
3. Consider shorter tenure if affordable

Would you like me to compare loan offers from different banks?`;
    }
    
    if (lowerQuery.includes("document") || lowerQuery.includes("paper")) {
      return `## Required Documents for Personal Loan 📄

Here's a comprehensive checklist:

### Identity Proof (Any one):
- ✅ Aadhaar Card
- ✅ PAN Card
- ✅ Passport
- ✅ Voter ID

### Address Proof (Any one):
- ✅ Utility Bills (within 3 months)
- ✅ Rent Agreement
- ✅ Bank Statement

### Income Proof:
- ✅ Last 3 months salary slips
- ✅ Last 6 months bank statements
- ✅ Form 16 / ITR for last 2 years

### Employment Proof:
- ✅ Employment letter / Offer letter
- ✅ Employee ID card

Shall I help you prepare for a specific bank's requirements?`;
    }
    
    if (lowerQuery.includes("save") || lowerQuery.includes("saving") || lowerQuery.includes("budget")) {
      return `## Smart Savings Tips 💰

Here are 5 practical ways to save on a ₹60,000 salary:

### 1. Follow the 50-30-20 Rule
- **50%** (₹30,000) → Needs (rent, groceries, utilities)
- **30%** (₹18,000) → Wants (entertainment, dining)
- **20%** (₹12,000) → Savings & Investments

### 2. Automate Your Savings
Set up auto-transfer to savings account on salary day.

### 3. Track Every Expense
Use apps like CredNest AI to categorize spending.

### 4. Cut Subscription Waste
Review and cancel unused subscriptions.

### 5. Meal Planning
Cooking at home can save ₹5,000-8,000/month.

**Potential Monthly Savings: ₹15,000-20,000**

Would you like me to create a personalized budget plan?`;
    }

    return `Thank you for your question! As your AI financial advisor, I'm here to help you with:

- 📊 **EMI Calculations** - For any loan type
- 📋 **Document Checklists** - Bank-specific requirements
- 💡 **Financial Tips** - Personalized savings strategies
- 🏦 **Loan Comparison** - Find the best rates
- 📈 **Investment Guidance** - Mutual fund analysis

How can I assist you today? Feel free to ask about loans, budgeting, investments, or any financial topic!`;
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
                  Your personal financial advisor
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
                            .replace(/- (.*?)(<br>|$)/g, "• $1<br>"),
                        }}
                      />
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="chat-bubble-ai flex items-center gap-2">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
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
