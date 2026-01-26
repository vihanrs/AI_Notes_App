"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import { Note } from "@/lib/db";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
  onDelete?: (noteId: string) => void;
  isDeleting?: boolean;
}

export function NoteCard({ note, onClick, onDelete, isDeleting = false }: NoteCardProps) {
  return (
    <Card
      className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-primary/5 hover:border-primary/20 bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col h-full"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
            {note.title}
          </CardTitle>
          {onDelete && (
            <DeleteConfirmDialog
              variant="icon"
              onConfirm={() => onDelete(note.id)}
              isLoading={isDeleting}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground text-sm line-clamp-4 leading-relaxed">
          {note.body}
        </p>
      </CardContent>
      <CardFooter className="pt-2 flex items-center justify-between border-t border-primary/5">
        <div className="flex items-center text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
          <Clock size={12} className="mr-1" />
          {note.createdAt ? formatDistanceToNow(note.createdAt, { addSuffix: true }) : "Just now"}
        </div>
        {note.source !== 'local' && (
          <div className="flex items-center text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
            <span className="capitalize">{note.source}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
