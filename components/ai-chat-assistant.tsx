"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  X,
  Send,
  Bot,
  Database,
  Search,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AIChatAssistantProps {
  institutionName?: string | null;
}

export function AIChatAssistant({ institutionName }: AIChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ sender: "ai" | "user"; text: string; time: string }>
  >([
    {
      sender: "ai",
      text: `Hello! I am your Campus RAG Assistant for ${
        institutionName || "this university"
      }. You can query live camera logs, vehicle entries, or classroom anomaly reports in natural language.`,
      time: "Just now",
    },
  ]);
  const [inputVal, setInputVal] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal;
    setInputVal("");
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userText, time: "Just now" },
      {
        sender: "ai",
        text: `[RAG Pipeline Querying Supabase pgvector]: Searching vector embeddings across surveillance metadata for: "${userText}"... (Model connection in Phase 3)`,
        time: "Just now",
      },
    ]);
  };

  const samplePrompts = [
    "Any unauthorized vehicles detected at North Gate today?",
    "Show attendance anomaly count in Engineering Hall A",
    "List security alerts triggered in the last 2 hours",
  ];

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-4 py-3.5 text-white shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all duration-200 group border border-white/20"
        aria-label="Open AI Surveillance Assistant"
      >
        <div className="relative">
          <Bot className="h-5 w-5 transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-300" />
          </span>
        </div>
        <span className="text-sm font-semibold tracking-wide">
          AI Data Assistant (RAG)
        </span>
      </button>

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Panel */}
          <div className="relative z-50 flex h-full w-full max-w-md flex-col bg-slate-900 border-l border-border/50 shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 bg-slate-950/80 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      AI Data Assistant
                    </h3>
                    <Badge variant="info" className="text-[10px] py-0 px-1.5">
                      RAG Ready
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supabase pgvector Knowledge Base
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close assistant"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-blue-400">
                  <Database className="h-3.5 w-3.5" />
                  <span>Tenant Isolation Safeguard</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Queries are automatically scoped to your institution's partitioned surveillance telemetry via PostgreSQL RLS.
                </p>
              </div>

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-none shadow-md"
                        : "bg-slate-800/90 text-slate-200 rounded-tl-none border border-border/40"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              ))}

              {/* Sample Prompts */}
              <div className="pt-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Suggested Queries
                </p>
                <div className="space-y-1.5">
                  {samplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputVal(prompt)}
                      className="w-full text-left text-xs bg-slate-800/50 hover:bg-slate-800 text-slate-300 p-2 rounded-lg border border-border/30 transition-colors truncate"
                    >
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Footer */}
            <form
              onSubmit={handleSend}
              className="border-t border-border/50 bg-slate-950/80 p-3 flex gap-2"
            >
              <Input
                placeholder="Ask about campus surveillance..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="bg-card/70 border-input text-sm"
              />
              <Button
                type="submit"
                size="icon"
                className="bg-blue-600 hover:bg-blue-500 text-white shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

