"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { BrainCircuit, Search, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { NOTES_QUERY_KEY } from "@/hooks/use-notes";
import { toast } from "sonner";
import { ChatHeader, ChatInput, ChatMessage as ChatMessageUI } from "./chat-ui";
import type { ChatMessage } from "@/app/api/chats/route";
import type { Note } from "@/lib/db";

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  onNoteLinkClick?: (id: string) => void;
}

/**
 * Extracts text content from a UIMessage by filtering and joining its text parts.
 */

export function ChatPanel({ open, onClose, onNoteLinkClick }: ChatPanelProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  // Focus input when panel opens without passing props down
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const input = document.getElementById("chat-input");
        if (input) input.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Auto-refresh the dashboard when a tool completes successfully
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;

    // Check specifically for TOOL RESULTS (output-available)
    lastMessage.parts.forEach(part => {
        if (part.type.startsWith('tool-') && 'state' in part && part.state === 'output-available' && part.output) {
            const toolName = part.type.replace('tool-', '');
            const result = part.output as any;

            if (result.success) {
                // Manually update React Query Cache for INSTANT UI response
                if (toolName === 'create_note' && result.note) {
                    queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (old) => {
                        const exists = old?.some(n => n.id === result.note.id);
                        if (exists) return old;
                        return [result.note, ...(old || [])];
                    });
                } else if (toolName === 'delete_note') {
                    const noteId = (part as any).input?.noteId;
                    if (noteId) {
                        queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (old) => {
                            return (old || []).filter(n => n.id !== noteId);
                        });
                    }
                } else if (toolName === 'update_note') {
                    const input = (part as any).input;
                    if (input?.noteId) {
                        queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (old) => {
                            return (old || []).map(n => 
                                n.id === input.noteId 
                                    ? { ...n, title: input.title, body: input.body, updatedAt: new Date() } 
                                    : n
                            );
                        });
                    }
                }
                
                // No more router.refresh() here! Keeping it purely client-side React Query.
            }
        }
    });
  }, [messages, queryClient]);

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
    <>
      {/* Backdrop for closing by clicking outside */}
      {open && (
        <div 
          className="fixed inset-0 bg-background/20 backdrop-blur-[2px] z-[55] animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}
      
      <div 
        className={cn(
          "fixed inset-y-0 right-0 w-full sm:w-[500px] bg-background border-l border-primary/10 shadow-2xl z-[60] flex flex-col transition-transform duration-300 ease-in-out",
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
                    case 'tool-create_note':
                    case 'tool-update_note':
                    case 'tool-delete_note':
                      {
                        const toolName = part.type.replace('tool-', '');
                        const toolLabel = toolName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        const Icon = toolName === 'search_notes' ? Search : 
                                     toolName === 'create_note' ? CheckCircle2 :
                                     toolName === 'update_note' ? FileText :
                                     AlertCircle;

                        if (part.state === 'output-available') return null;

                        if (part.state === 'output-error') {
                          return (
                            <div key={`tool-${m.id}-${pIndex}`} className="ml-12 mb-4 p-3 rounded-2xl border bg-destructive/5 border-destructive/10 flex items-center gap-3">
                               <AlertCircle size={14} className="text-destructive" />
                               <span className="text-xs text-destructive font-medium italic">{toolLabel} failed: {part.errorText}</span>
                            </div>
                          );
                        }

                        // Rendering for input-streaming and input-available
                        let statusText = `Planning ${toolLabel.toLowerCase()}...`;
                        if (part.state === 'input-available') {
                          if (toolName === 'search_notes' && 'query' in part.input) {
                            statusText = `Searching for: "${part.input.query}"`;
                          } else if (toolName === 'create_note' && 'title' in part.input) {
                            statusText = `Creating: "${part.input.title}"`;
                          } else if (toolName === 'update_note' && 'title' in part.input) {
                            statusText = `Updating: "${part.input.title}"`;
                          } else {
                            statusText = `${toolLabel} in progress...`;
                          }
                        }

                        return (
                          <div 
                            key={`tool-${m.id}-${pIndex}`}
                            className="ml-12 mb-4 p-3 rounded-2xl border bg-primary/5 border-primary/10 shadow-inner flex items-center gap-3 animate-in fade-in slide-in-from-left-2"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 border-primary/20 text-primary flex items-center justify-center shrink-0 border">
                              {part.state === 'input-streaming' ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} className="animate-pulse" />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">{toolLabel}</span>
                              <span className="text-xs italic truncate">{statusText}</span>
                            </div>
                          </div>
                        );
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
    </>
  );
}
