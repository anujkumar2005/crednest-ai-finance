import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import {
  Search, Send, Loader2, Bot, User, ExternalLink, Landmark, Shield, Building2,
  Tractor, GraduationCap, Heart, Users, CheckCircle2, AlertCircle, FileCheck,
  Sparkles, Plus, Trash2, BookOpen
} from "lucide-react";

interface Scheme {
  id: string;
  name: string;
  description: string;
  category: string;
  target_audience: string;
  ministry: string;
  eligibility_criteria: any;
  benefits: string;
  how_to_apply: string;
  documents_required: string[];
  website_url: string;
  is_active: boolean;
  launch_year: number;
  keywords: string[];
  income_limit: number | null;
  age_min: number | null;
  age_max: number | null;
}

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

const categoryIcons: Record<string, React.ElementType> = {
  savings: Landmark, insurance: Shield, tax: FileCheck, business: Building2,
  agriculture: Tractor, housing: Building2, education: GraduationCap,
  women: Heart, senior_citizen: Users, general: Sparkles,
};

const categoryColors: Record<string, string> = {
  savings: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  insurance: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  tax: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  business: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  agriculture: "bg-green-500/10 text-green-500 border-green-500/20",
  housing: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  education: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  women: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  senior_citizen: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  general: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
};

export default function Schemes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  // Chat state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatPhase, setChatPhase] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Compliance state
  const [complianceType, setComplianceType] = useState<"individual" | "business">("individual");
  const [complianceResults, setComplianceResults] = useState<any>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceInput, setComplianceInput] = useState({
    age: "", income: "", occupation: "", state: "", gender: "",
    businessType: "", turnover: "", employees: "", sector: "",
  });

  useEffect(() => {
    fetchSchemes();
    if (user) {
      fetchProfile();
      loadChatSessions();
    }
  }, [user]);

  const fetchSchemes = async () => {
    const { data } = await supabase.from("government_schemes").select("*").eq("is_active", true);
    if (data) setSchemes(data as unknown as Scheme[]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    if (data) setUserProfile(data);
  };

  const loadChatSessions = async () => {
    if (!user) return;
    const { data: sessions } = await supabase
      .from("chat_sessions").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    if (sessions) {
      const loaded: ChatSession[] = [];
      for (const s of sessions) {
        const { data: msgs } = await supabase
          .from("chat_messages").select("*").eq("session_id", s.id).order("created_at", { ascending: true });
        if (msgs && msgs.some(m => m.tool_used === "scheme-chat")) {
          loaded.push({
            id: s.id, title: s.title || "Scheme Chat",
            messages: msgs.filter(m => m.tool_used === "scheme-chat").map(m => ({
              id: m.id, role: m.role as "user" | "assistant", content: m.content, timestamp: new Date(m.created_at!),
            })),
            createdAt: new Date(s.created_at!),
          });
        }
      }
      setChatSessions(loaded);
    }
  };

  const activeSession = useMemo(
    () => chatSessions.find(s => s.id === activeSessionId),
    [chatSessions, activeSessionId]
  );

  const scrollToBottom = useCallback(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  const createNewSession = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_sessions").insert({ user_id: user.id, title: "Scheme Chat" }).select().single();
    if (data) {
      const newSession: ChatSession = { id: data.id, title: "Scheme Chat", messages: [], createdAt: new Date() };
      setChatSessions(prev => [newSession, ...prev]);
      setActiveSessionId(data.id);
    }
  };

  const deleteSession = async (sessionId: string) => {
    await supabase.from("chat_messages").delete().eq("session_id", sessionId).eq("tool_used", "scheme-chat");
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) setActiveSessionId(null);
  };

  const saveMessage = async (sessionId: string, role: string, content: string) => {
    if (!user) return;
    await supabase.from("chat_messages").insert({
      session_id: sessionId, user_id: user.id, role, content, tool_used: "scheme-chat",
    });
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isTyping || !user) return;
    let sessionId = activeSessionId;
    if (!sessionId) {
      const { data } = await supabase
        .from("chat_sessions").insert({ user_id: user.id, title: chatInput.slice(0, 50) }).select().single();
      if (!data) return;
      sessionId = data.id;
      const newSession: ChatSession = { id: data.id, title: chatInput.slice(0, 50), messages: [], createdAt: new Date() };
      setChatSessions(prev => [newSession, ...prev]);
      setActiveSessionId(sessionId);
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: chatInput, timestamp: new Date() };
    setChatSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...s.messages, userMsg] } : s));
    saveMessage(sessionId, "user", chatInput);
    setChatInput("");
    setIsTyping(true);
    setChatPhase("Searching schemes...");
    scrollToBottom();

    const currentSession = chatSessions.find(s => s.id === sessionId);
    const history = [...(currentSession?.messages || []), userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      setTimeout(() => setChatPhase("Analyzing eligibility..."), 1500);
      setTimeout(() => setChatPhase("Generating recommendations..."), 3000);

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scheme-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: history, userProfile }),
      });

      if (resp.status === 429) {
        toast({ title: "Rate Limited", description: "Please wait a moment and try again.", variant: "destructive" });
        setIsTyping(false); setChatPhase(""); return;
      }
      if (resp.status === 402) {
        toast({ title: "Credits Exhausted", description: "Please add AI credits to continue.", variant: "destructive" });
        setIsTyping(false); setChatPhase(""); return;
      }
      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setChatSessions(prev => prev.map(s => {
                if (s.id !== sessionId) return s;
                const msgs = [...s.messages];
                const last = msgs[msgs.length - 1];
                if (last?.role === "assistant" && last.id === assistantId) {
                  msgs[msgs.length - 1] = { ...last, content: assistantContent };
                } else {
                  msgs.push({ id: assistantId, role: "assistant", content: assistantContent, timestamp: new Date() });
                }
                return { ...s, messages: msgs };
              }));
              scrollToBottom();
            }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
      if (assistantContent) saveMessage(sessionId, "assistant", assistantContent);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to get response.", variant: "destructive" });
    }
    setIsTyping(false);
    setChatPhase("");
  };

  const runComplianceCheck = async () => {
    if (!user) return;
    setComplianceLoading(true);
    const prompt = complianceType === "individual"
      ? `Run a comprehensive compliance check for an Indian individual with: Age: ${complianceInput.age}, Annual Income: ₹${complianceInput.income}, Occupation: ${complianceInput.occupation}, State: ${complianceInput.state}, Gender: ${complianceInput.gender}. Check: Tax filing requirements, KYC compliance, eligible schemes, insurance requirements, investment regulations. Format as a compliance report with ✅ Compliant, ⚠️ Action Needed, ❌ Non-Compliant items.`
      : `Run a comprehensive compliance check for an Indian business: Type: ${complianceInput.businessType}, Annual Turnover: ₹${complianceInput.turnover}, Employees: ${complianceInput.employees}, Sector: ${complianceInput.sector}, State: ${complianceInput.state}. Check: GST registration, MSME registration, labour laws (PF/ESI), Shop & Establishment Act, professional tax, trade license, FSSAI (if food), startup recognition (DPIIT), environmental clearances. Format as compliance report with ✅ ⚠️ ❌ items and eligible government schemes.`;

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scheme-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], userProfile }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") break;
          try {
            const p = JSON.parse(j);
            const d = p.choices?.[0]?.delta?.content;
            if (d) { result += d; setComplianceResults(result); }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e) {
      toast({ title: "Error", description: "Compliance check failed.", variant: "destructive" });
    }
    setComplianceLoading(false);
  };

  const filteredSchemes = useMemo(() => {
    return schemes.filter(s => {
      const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
      const matchAudience = audienceFilter === "all" || s.target_audience === audienceFilter;
      return matchSearch && matchCategory && matchAudience;
    });
  }, [schemes, searchQuery, categoryFilter, audienceFilter]);

  const quickQuestions = [
    "Which schemes am I eligible for based on my profile?",
    "Best government savings schemes with highest interest?",
    "What schemes are available for women entrepreneurs?",
    "MSME registration benefits and eligible schemes?",
    "How to apply for PM Awas Yojana?",
    "GST compliance checklist for small business",
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Government Schemes</h1>
          <p className="text-muted-foreground mt-1">Explore Indian financial schemes, check eligibility & compliance</p>
        </div>

        <Tabs defaultValue="explore" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="explore"><BookOpen className="h-4 w-4 mr-2" />Explore</TabsTrigger>
            <TabsTrigger value="assistant"><Bot className="h-4 w-4 mr-2" />AI Assistant</TabsTrigger>
            <TabsTrigger value="compliance"><FileCheck className="h-4 w-4 mr-2" />Compliance</TabsTrigger>
          </TabsList>

          {/* EXPLORE TAB */}
          <TabsContent value="explore" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search schemes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                  <SelectItem value="housing">Housing</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
              <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Audience" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Audiences</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="farmer">Farmers</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="senior_citizen">Senior Citizens</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">{filteredSchemes.length} schemes found</p>

            {selectedScheme ? (
              <Card className="border-primary/30">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{selectedScheme.name}</CardTitle>
                      <CardDescription>{selectedScheme.ministry} · Launched {selectedScheme.launch_year}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedScheme(null)}>Back</Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className={categoryColors[selectedScheme.category]}>{selectedScheme.category}</Badge>
                    <Badge variant="outline">{selectedScheme.target_audience}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div><h3 className="font-semibold mb-1">Description</h3><p className="text-sm text-muted-foreground">{selectedScheme.description}</p></div>
                  <div><h3 className="font-semibold mb-1">Benefits</h3><p className="text-sm text-muted-foreground">{selectedScheme.benefits}</p></div>
                  <div><h3 className="font-semibold mb-1">How to Apply</h3><p className="text-sm text-muted-foreground">{selectedScheme.how_to_apply}</p></div>
                  {selectedScheme.documents_required && (
                    <div><h3 className="font-semibold mb-1">Documents Required</h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {selectedScheme.documents_required.map((d, i) => <li key={i} className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-primary" />{d}</li>)}
                      </ul>
                    </div>
                  )}
                  {selectedScheme.eligibility_criteria && (
                    <div><h3 className="font-semibold mb-1">Eligibility</h3>
                      <pre className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">{JSON.stringify(selectedScheme.eligibility_criteria, null, 2)}</pre>
                    </div>
                  )}
                  {selectedScheme.website_url && (
                    <Button variant="outline" onClick={() => window.open(selectedScheme.website_url, "_blank")}>
                      <ExternalLink className="h-4 w-4 mr-2" />Visit Official Website
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-4 bg-muted rounded w-3/4 mb-3" /><div className="h-3 bg-muted rounded w-full mb-2" /><div className="h-3 bg-muted rounded w-2/3" /></CardContent></Card>
                )) : filteredSchemes.map(scheme => {
                  const Icon = categoryIcons[scheme.category] || Sparkles;
                  return (
                    <Card key={scheme.id} className="cursor-pointer hover:border-primary/50 transition-all" onClick={() => setSelectedScheme(scheme)}>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${categoryColors[scheme.category] || "bg-muted"}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{scheme.name}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{scheme.ministry}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{scheme.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-xs ${categoryColors[scheme.category]}`}>{scheme.category}</Badge>
                          <Badge variant="outline" className="text-xs">{scheme.target_audience}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* AI ASSISTANT TAB */}
          <TabsContent value="assistant">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-280px)]">
              {/* Sidebar */}
              <div className="lg:col-span-1 border rounded-lg p-3 space-y-2 overflow-y-auto">
                <Button onClick={createNewSession} className="w-full" size="sm"><Plus className="h-4 w-4 mr-2" />New Chat</Button>
                {chatSessions.map(s => (
                  <div key={s.id} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm hover:bg-muted/50 ${activeSessionId === s.id ? "bg-muted" : ""}`} onClick={() => setActiveSessionId(s.id)}>
                    <span className="truncate flex-1">{s.title}</span>
                    <button onClick={e => { e.stopPropagation(); deleteSession(s.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-3 border rounded-lg flex flex-col">
                <div className="p-3 border-b flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <span className="font-semibold">SchemeGuru AI</span>
                  <Badge variant="outline" className="text-xs">Schemes Expert</Badge>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {!activeSession || activeSession.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                      <Landmark className="h-12 w-12 text-primary/30" />
                      <div><h3 className="font-semibold text-lg">SchemeGuru AI</h3><p className="text-sm text-muted-foreground">Ask about government schemes, eligibility, or compliance</p></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                        {quickQuestions.map((q, i) => (
                          <Button key={i} variant="outline" size="sm" className="text-xs text-left h-auto py-2 whitespace-normal" onClick={() => { setChatInput(q); }}>
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeSession.messages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                          {msg.role === "assistant" && <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-primary" /></div>}
                          <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}>
                            {msg.role === "assistant" ? <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div> : msg.content}
                          </div>
                          {msg.role === "user" && <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><User className="h-4 w-4 text-primary-foreground" /></div>}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="h-4 w-4 text-primary animate-pulse" /></div>
                          <div className="bg-muted/50 rounded-lg p-3 text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{chatPhase}</div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="p-3 border-t flex gap-2">
                  <Input placeholder="Ask about schemes, eligibility, compliance..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSendChat()} disabled={isTyping} />
                  <Button onClick={handleSendChat} disabled={isTyping || !chatInput.trim()} size="icon"><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* COMPLIANCE TAB */}
          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" />Compliance & Eligibility Checker</CardTitle>
                <CardDescription>Check regulatory compliance and scheme eligibility for individuals or businesses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={complianceType} onValueChange={v => { setComplianceType(v as any); setComplianceResults(null); }}>
                  <TabsList><TabsTrigger value="individual"><User className="h-4 w-4 mr-2" />Individual</TabsTrigger><TabsTrigger value="business"><Building2 className="h-4 w-4 mr-2" />Business</TabsTrigger></TabsList>

                  <TabsContent value="individual" className="space-y-3 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input placeholder="Age" value={complianceInput.age} onChange={e => setComplianceInput(p => ({ ...p, age: e.target.value }))} />
                      <Input placeholder="Annual Income (₹)" value={complianceInput.income} onChange={e => setComplianceInput(p => ({ ...p, income: e.target.value }))} />
                      <Input placeholder="Occupation" value={complianceInput.occupation} onChange={e => setComplianceInput(p => ({ ...p, occupation: e.target.value }))} />
                      <Input placeholder="State" value={complianceInput.state} onChange={e => setComplianceInput(p => ({ ...p, state: e.target.value }))} />
                      <Select value={complianceInput.gender} onValueChange={v => setComplianceInput(p => ({ ...p, gender: v }))}>
                        <SelectTrigger><SelectValue placeholder="Gender" /></SelectTrigger>
                        <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="business" className="space-y-3 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input placeholder="Business Type (e.g., Sole Prop, Pvt Ltd)" value={complianceInput.businessType} onChange={e => setComplianceInput(p => ({ ...p, businessType: e.target.value }))} />
                      <Input placeholder="Annual Turnover (₹)" value={complianceInput.turnover} onChange={e => setComplianceInput(p => ({ ...p, turnover: e.target.value }))} />
                      <Input placeholder="Number of Employees" value={complianceInput.employees} onChange={e => setComplianceInput(p => ({ ...p, employees: e.target.value }))} />
                      <Input placeholder="Sector (e.g., IT, Manufacturing)" value={complianceInput.sector} onChange={e => setComplianceInput(p => ({ ...p, sector: e.target.value }))} />
                      <Input placeholder="State" value={complianceInput.state} onChange={e => setComplianceInput(p => ({ ...p, state: e.target.value }))} />
                    </div>
                  </TabsContent>
                </Tabs>

                <Button onClick={runComplianceCheck} disabled={complianceLoading} className="w-full sm:w-auto">
                  {complianceLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running Check...</> : <><AlertCircle className="h-4 w-4 mr-2" />Run Compliance Check</>}
                </Button>

                {complianceResults && (
                  <Card className="mt-4 border-primary/30">
                    <CardHeader><CardTitle className="text-lg">Compliance Report</CardTitle></CardHeader>
                    <CardContent><div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{complianceResults}</ReactMarkdown></div></CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
