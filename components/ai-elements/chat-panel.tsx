// "use client";

// import { useChat } from "@ai-sdk/react";
// import { BrainCircuit, Send, X, User, Bot, Loader2, Sparkles } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { cn } from "@/lib/utils";
// import { useEffect, useRef, useState } from "react";
// import { toast } from "sonner";

// interface ChatPanelProps {
//   open: boolean;
//   onClose: () => void;
// }

// export function ChatPanel({ open, onClose }: ChatPanelProps) {
//   const [chatInput, setChatInput] = useState("");
//   const { messages, append, isLoading, error } = useChat();
//   const scrollRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     if (scrollRef.current) {
//       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
//     }
//   }, [messages]);

//   useEffect(() => {
//     if (error) {
//       toast.error(error.message || "Failed to connect to AI");
//     }
//   }, [error]);

//   const handleFormSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!chatInput.trim() || isLoading) return;

//     const message = chatInput;
//     setChatInput(""); // Clear input immediately for better UX
//     await append({ content: message, role: "user" });
//   };

//   if (!open) return null;

//   return (
//     <div 
//       className={cn(
//         "fixed inset-y-0 right-0 w-full sm:w-[500px] bg-background border-l border-primary/10 shadow-2xl z-[60] flex flex-col transition-transform duration-300 ease-in-out",
//         open ? "translate-x-0" : "translate-x-full"
//       )}
//     >
//       {/* Header */}
//       <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-primary/5">
//         <div className="flex items-center gap-2">
//           <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
//             <BrainCircuit size={20} />
//           </div>
//           <div>
//             <h3 className="font-bold">AI Assistant</h3>
//             <p className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider font-semibold">
//               <Sparkles size={10} className="text-primary" />
//               Powered by RAG
//             </p>
//           </div>
//         </div>
//         <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
//           <X size={20} />
//         </Button>
//       </div>

//       {/* Messages */}
//       <ScrollArea className="flex-1 p-4" ref={scrollRef}>
//         <div className="space-y-6 pb-4">
//           {messages.length === 0 && (
//             <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
//               <div className="bg-primary/5 p-4 rounded-full">
//                 <BrainCircuit size={48} className="text-primary/40" />
//               </div>
//               <div className="space-y-2">
//                 <h4 className="font-semibold text-lg">How can I help you today?</h4>
//                 <p className="text-sm text-muted-foreground max-w-[250px]">
//                   Ask me anything about your notes. I can find specific info, summarize topics, or help you brainstorm.
//                 </p>
//               </div>
//             </div>
//           )}

//           {messages.map((m) => (
//             <div 
//               key={m.id} 
//               className={cn(
//                 "flex gap-3 max-w-[90%]",
//                 m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
//               )}
//             >
//               <div className={cn(
//                 "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
//                 m.role === "user" ? "bg-muted" : "bg-primary/10 border-primary/20 text-primary"
//               )}>
//                 {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
//               </div>
//               <div className={cn(
//                 "p-3 rounded-2xl text-sm shadow-sm",
//                 m.role === "user" 
//                   ? "bg-primary text-primary-foreground rounded-tr-none" 
//                   : "bg-muted/50 border border-primary/5 rounded-tl-none"
//               )}>
//                 {m.content}
//               </div>
//             </div>
//           ))}

//           {isLoading && (
//             <div className="flex gap-3 mr-auto">
//               <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20 text-primary">
//                 <Bot size={16} />
//               </div>
//               <div className="p-3 rounded-2xl rounded-tl-none bg-muted/50 border border-primary/5">
//                 <Loader2 size={16} className="animate-spin text-primary" />
//               </div>
//             </div>
//           )}
//         </div>
//       </ScrollArea>

//       {/* Input */}
//       <div className="p-4 border-t border-primary/10 bg-background">
//         <form onSubmit={handleFormSubmit} className="flex gap-2">
//           <Input 
//             placeholder="Ask your notes..." 
//             className="flex-1 bg-muted/30 focus-visible:ring-primary/50"
//             value={chatInput}
//             onChange={(e) => setChatInput(e.target.value)}
//             disabled={isLoading}
//           />
//           <Button type="submit" size="icon" disabled={isLoading || !chatInput.trim()} className="rounded-full shadow-lg shadow-primary/20">
//             {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
//           </Button>
//         </form>
//         <p className="text-[10px] text-center mt-3 text-muted-foreground uppercase tracking-widest font-semibold opacity-50">
//           SmartNotes AI Assistant
//         </p>
//       </div>
//     </div>
//   );
// }
