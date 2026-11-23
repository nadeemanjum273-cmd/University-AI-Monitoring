"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChatDataCard, AskCampusAiResponse } from "@/app/api/ask-campus-ai/route";
import {
  Sparkles,
  Bot,
  User,
  X,
  Send,
  Loader2,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Car,
  RotateCcw,
  Maximize2,
  ChevronDown,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  dataCards?: ChatDataCard[];
  suggestedQuestions?: string[];
  timestamp: string;
}

const INITIAL_SUGGESTIONS = [
  "Which class had the lowest attendance?",
  "Which teacher taught for the longest time?",
  "How many vehicles arrived in total?",
  "Summarize full campus surveillance",
];

export function AskCampusAiWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "Hello! I am **Campus AI Assistant**. I can instantly query and analyze telemetry from your classroom attendance models and vehicle gate barrier tracking.",
      suggestedQuestions: INITIAL_SUGGESTIONS,
      timestamp: "Just now",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ask-campus-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });

      if (!res.ok) {
        throw new Error("Failed to query campus intelligence API");
      }

      const data: AskCampusAiResponse = await res.json();

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: data.answer,
        dataCards: data.dataCards,
        suggestedQuestions: data.suggestedQuestions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "assistant",
          text: "I encountered an error querying the database telemetry. Please ensure the backend worker is running or try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "assistant",
        text: "Conversation refreshed. What telemetry would you like to query?",
        suggestedQuestions: INITIAL_SUGGESTIONS,
        timestamp: "Just now",
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 rounded-full bg-white/95 px-4 py-3 text-slate-800 shadow-xl shadow-blue-500/10 ring-1 ring-slate-200/90 transition-all duration-300 hover:scale-105 hover:border-blue-300 hover:shadow-blue-500/20 active:scale-95 backdrop-blur-md"
            aria-label="Open Ask Campus AI Chat"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </span>
            <Sparkles className="h-4 w-4 text-amber-500 transition-transform group-hover:rotate-12" />
            <span className="font-semibold text-xs sm:text-sm tracking-wide bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Ask Campus AI
            </span>
          </button>
        )}
      </div>

      {/* Floating Light Sleek Glassmorphism Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex h-[620px] w-[95vw] sm:w-[440px] flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 text-slate-800 shadow-2xl shadow-blue-950/15 backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 print:hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/50 px-4 py-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Ask Campus AI
                  </h3>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    RAG Connected
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Natural language telemetry search
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Restart Chat"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/60 scrollbar-thin scrollbar-thumb-slate-200">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs shadow-blue-500/20 font-medium"
                      : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-xs"
                  }`}
                >
                  <div className="whitespace-pre-line font-normal">
                    {msg.text}
                  </div>

                  {/* Render Data Cards if present */}
                  {msg.dataCards && msg.dataCards.length > 0 && (
                    <div className="mt-3.5 space-y-3">
                      {msg.dataCards.map((card) => {
                        const isClass = card.pipelineType === "classroom";
                        return (
                          <div
                            key={card.videoId}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
                          >
                            {/* Snapshot Thumbnail */}
                            {card.snapshotUrl ? (
                              <div className="relative h-32 w-full bg-slate-100">
                                <img
                                  src={card.snapshotUrl}
                                  alt={card.title}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute top-2 left-2 flex gap-1.5">
                                  <Badge
                                    className={`text-[9px] font-semibold py-0.5 px-2 border shadow-xs ${
                                      isClass
                                        ? "bg-emerald-600/90 text-white border-emerald-500/30"
                                        : "bg-blue-600/90 text-white border-blue-500/30"
                                    }`}
                                  >
                                    {isClass ? "Classroom AI" : "Vehicle Gate"}
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-20 items-center justify-center bg-slate-50 text-slate-400">
                                <Layers className="h-6 w-6 mr-1" />
                                <span className="text-[10px]">No Snapshot Image</span>
                              </div>
                            )}

                            {/* Card Details */}
                            <div className="p-3 space-y-2.5">
                              <p className="font-bold text-xs text-slate-900 truncate">
                                {card.title}
                              </p>

                              {/* Metrics Row */}
                              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <div>
                                  <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-semibold">
                                    {card.primaryMetric.label}
                                  </span>
                                  <span className="font-bold text-blue-600 text-xs">
                                    {card.primaryMetric.value}
                                  </span>
                                </div>
                                {card.secondaryMetric && (
                                  <div>
                                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-semibold">
                                      {card.secondaryMetric.label}
                                    </span>
                                    <span className="font-bold text-slate-700 text-xs truncate block">
                                      {card.secondaryMetric.value}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Button linking to the full detailed report */}
                              <Link
                                href={card.reportUrl}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-2 text-[11px] font-semibold text-white shadow-sm shadow-blue-500/20 transition-all mt-1"
                              >
                                <span>View Annotated Video & Report</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>

                {/* Suggestion Chips */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[95%]">
                    {msg.suggestedQuestions.map((qText) => (
                      <button
                        key={qText}
                        onClick={() => handleSend(qText)}
                        disabled={isLoading}
                        className="rounded-xl border border-slate-200/90 bg-white hover:bg-blue-50/80 hover:border-blue-300 hover:text-blue-700 px-3 py-1.5 text-[11px] text-slate-600 transition-all text-left flex items-center gap-1.5 shadow-xs group cursor-pointer"
                      >
                        <Sparkles className="h-3 w-3 text-amber-500 group-hover:text-blue-600 transition-colors" />
                        <span className="font-medium">{qText}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200/80 p-3 max-w-[75%] shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-xs text-slate-500 font-medium">
                  Analyzing YOLOv8 & ByteTrack telemetry...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="border-t border-slate-100 bg-white p-3 backdrop-blur-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask about attendance, teaching time, vehicles..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputQuery.trim() || isLoading}
                className="h-9 w-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 p-0 text-white shadow-sm shadow-blue-500/20 disabled:opacity-40 transition-all cursor-pointer"
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

