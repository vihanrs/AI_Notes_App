"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { BrainCircuit, Search, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatHeader, ChatInput, ChatMessage as ChatMessageUI } from "./chat-ui";
import type { ChatMessage } from "@/app/api/chats/route";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  onNoteLinkClick?: (id: string) => void;
}

/**
 * Extracts text content from a UIMessage by filtering and joining its text parts.
 */

export function ChatPanel({ open, onClose, onNoteLinkClick }: ChatPanelProps) {
  const [chatInput, setChatInput] = useState("");
  // Now using the typed ChatMessage from our API route
  const { messages, sendMessage, status, error } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({
      api: "/api/chats",
    }),
  });
  
  // Derive isLoading from status for backward compatibility in the component
  const isLoading = status === 'streaming' || status === 'submitted';
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, open]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to connect to AI");
    }
  }, [error]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const message = chatInput;
    setChatInput(""); // Clear input immediately for better UX
    
    // In SDK v6, append is replaced by sendMessage with a different object structure
    await sendMessage({ text: message });
  };

  return (
    <div 
      className={cn(
        "fixed inset-y-0 right-0 w-full sm:w-[500px] bg-background border-l border-primary/10 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out mt-14 sm:mt-0",
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      <ChatHeader onClose={onClose} />

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-6"
      >
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="bg-primary/5 p-6 rounded-3xl relative">
                <BrainCircuit size={64} className="text-primary/30" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
              </div>
              <div className="space-y-2 px-6">
                <h4 className="font-bold text-xl tracking-tight">AI Knowledge Base</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  I can analyze your notes, summarize long texts, or find specific details using semantic search.
                </p>
              </div>

            </div>
          )}

          {messages.map((m, index) => (
            <div key={m.id || index} className="space-y-4">
              <ChatMessageUI 
                role={m.role as "user" | "assistant"} 
                content={m.parts
                  .filter((p): p is { type: "text"; text: string } => p.type === "text")
                  .map((p) => p.text)
                  .join("\n")} 
                isStreaming={isLoading && index === messages.length - 1 && m.role === "assistant"}
                onNoteClick={onNoteLinkClick}
              />
              
              {/* Tool Calls for this message using switch/case pattern from learnings */}
              {m.parts.map((part, pIndex) => {
                switch (part.type) {
                  case 'tool-search_notes':
                    switch (part.state) {
                      case 'input-streaming':
                      case 'input-available':
                        return (
                          <div 
                            key={`tool-${m.id}-${pIndex}`}
                            className="ml-12 mb-4 p-3 rounded-2xl border bg-primary/5 border-primary/10 shadow-inner flex items-center gap-3 animate-in fade-in slide-in-from-left-2"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 border-primary/20 text-primary flex items-center justify-center shrink-0 border">
                              {part.state === 'input-streaming' ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} className="animate-pulse" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Semantic Search</span>
                              <span className="text-xs italic truncate">
                                {part.state === 'input-streaming' ? 'Planning search...' : `Searching for: "${part.input.query}"`}
                              </span>
                            </div>
                          </div>
                        );
                      case 'output-available':
                        // Hide search results to keep chat clean as per user request
                        return null;
                      case 'output-error':
                        return (
                          <div key={`tool-${m.id}-${pIndex}`} className="ml-12 mb-4 p-3 rounded-2xl border bg-destructive/5 border-destructive/10 flex items-center gap-3">
                             <AlertCircle size={14} className="text-destructive" />
                             <span className="text-xs text-destructive font-medium italic">Search failed: {part.errorText}</span>
                          </div>
                        );
                      default:
                        return null;
                    }
                  default:
                    return null;
                }
              })}
            </div>
          ))}

          {/* Fallback Tool usage indicator for active streaming */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-3 text-muted-foreground animate-pulse ml-12">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
                <BrainCircuit size={14} className="animate-spin" />
              </div>
              <span className="text-xs font-medium italic">Processing request...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Section */}
      <div className="p-4 border-t border-primary/10 bg-background/50 backdrop-blur-sm">
        <ChatInput 
          value={chatInput}
          onChange={setChatInput}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
        />
        <p className="text-[9px] text-center mt-3 text-muted-foreground uppercase tracking-[0.2em] font-black opacity-30 select-none">
          Secure Neural Processing
        </p>
      </div>
    </div>
  );
}
