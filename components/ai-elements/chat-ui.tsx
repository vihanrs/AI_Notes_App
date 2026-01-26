"use client";

import React, { useEffect, useRef } from "react";
import { User, Bot, Copy, Check, BrainCircuit, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Markdown from "@/components/markdown";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

// --- CHAT MESSAGE ---
interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  onNoteClick?: (id: string) => void;
}

export function ChatMessage({ role, content, isStreaming, onNoteClick }: ChatMessageProps) {
  const { copy, copied } = useCopyToClipboard();

  const handleNoteLinkClick = (id: string) => {
    if (onNoteClick) onNoteClick(id);
  };

  const handleCopy = () => {
    copy(content);
  };

  return (
    <div className={cn(
      "flex w-full gap-4 group mb-6",
      role === "user" ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-1",
        role === "user" 
          ? "bg-muted border-border" 
          : "bg-primary/10 border-primary/20 text-primary"
      )}>
        {role === "user" ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Content Bubble */}
      <div className={cn(
        "flex flex-col gap-2 max-w-[85%]",
        role === "user" ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-4 py-3 rounded-2xl text-sm leading-relaxed",
          role === "user" 
            ? "bg-primary text-primary-foreground rounded-tr-none shadow-sm" 
            : "bg-muted/50 border border-primary/5 rounded-tl-none"
        )}>
          {role === "assistant" ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown onNoteClick={handleNoteLinkClick}>{content}</Markdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}

          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-primary/40 animate-pulse align-middle" />
          )}
        </div>

        {/* Footer Actions (Copy, etc.) - Only for Assistant */}
        {role === "assistant" && !isStreaming && content && (
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary mt-1"
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? "Copied" : "Copy response"}
          </button>
        )}
      </div>
    </div>
  );
}

// --- CHAT INPUT ---
interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function ChatInput({ value, onChange, onSubmit, isLoading, placeholder }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [value]);

  // Focus textarea when it becomes available after loading
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Cast to unknown first to safely convert KeyboardEvent to FormEvent for the handler
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form 
      onSubmit={onSubmit}
      className="relative flex items-end gap-2 bg-muted/30 border border-primary/10 rounded-2xl p-2 focus-within:border-primary/30 transition-colors shadow-inner"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isLoading ? "AI is thinking..." : (placeholder || "Ask your notes anything...")}
        className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 px-3 text-sm min-h-[40px] max-h-[200px]"
        disabled={isLoading}
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={isLoading || !value.trim()} 
        className="rounded-xl h-10 w-10 shrink-0 shadow-lg shadow-primary/20 transition-all active:scale-95"
      >
        {isLoading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Send size={18} />
        )}
      </Button>
    </form>
  );
}

// --- CHAT HEADER ---
interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="px-6 py-5 border-b border-primary/10 flex items-center justify-between bg-primary/5 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
          <BrainCircuit size={22} className="animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-lg leading-none mb-1">AI Notes Assistant</h3>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Online & Ready</span>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
        <X size={20} />
      </Button>
    </div>
  );
}
