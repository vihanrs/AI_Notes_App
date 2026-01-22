"use client";

import { useState } from "react";
import { Plus, BrainCircuit, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteCard } from "@/components/notes/note-card";
import { NoteDialog } from "@/components/notes/note-dialog";
import { ChatPanel } from "@/components/ai-elements/chat-panel";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  body: string;
  source: string;
  created_at: string;
}

interface NotesListProps {
  initialNotes: Note[];
}

export function NotesList({ initialNotes }: NotesListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | undefined>(undefined);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleOpenCreateDialog = () => {
    setSelectedNote(undefined);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (note: Note) => {
    setSelectedNote(note);
    setIsDialogOpen(true);
  };

  // Filters notes based on the search query (title or body)
  const filteredNotes = initialNotes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* HEADER SECTION: Title and Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Notes</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Organize your thoughts with AI intelligence
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
          <Button 
            className="flex-1 md:flex-none gap-2 shadow-lg shadow-primary/20"
            onClick={handleOpenCreateDialog}
          >
            <Plus size={20} />
            Create Note
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 border-primary/20 hover:bg-primary/5 group"
            onClick={() => setIsChatOpen(true)}
          >
            <BrainCircuit size={20} className="text-primary transition-transform group-hover:scale-110" />
            AI Chat
          </Button>
        </div>
      </div>

      {/* SEARCH BAR SECTION */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input 
          placeholder="Search through your notes..." 
          className="pl-10 h-12 bg-muted/30 border-primary/5 focus-visible:ring-primary/50 text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* CONTENT SECTION: Empty State or Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-primary/20">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus size={32} className="text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No notes found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            {searchQuery 
              ? "We couldn't find any notes matching your search." 
              : "You haven't created any notes yet. Start by creating your first note!"}
          </p>
          {!searchQuery && (
            <Button onClick={handleOpenCreateDialog} variant="outline">
              Create First Note
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <NoteCard 
              key={note.id} 
              note={note} 
              onClick={() => handleOpenEditDialog(note)}
            />
          ))}
        </div>
      )}

      {/* DIALOGS & OVERLAYS */}
      <NoteDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        note={selectedNote}
      />

      <ChatPanel 
        open={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        onNoteLinkClick={(id) => {
          const cleanId = id.trim();
          const note = initialNotes.find(n => n.id === cleanId);
          if (note) {
            setIsChatOpen(false);
            // Small timeout to let the panel slide away before opening dialog
            setTimeout(() => {
              handleOpenEditDialog(note);
            }, 300);
          } else {
            toast.error("Referenced note not found in your collection.");
          }
        }}
      />
    </div>
  );
}
