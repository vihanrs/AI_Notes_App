"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Loader2, Clock } from "lucide-react";
import { deleteNoteAction } from "@/app/actions/notes";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Note } from "@/lib/db";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteNoteAction(note.id);
      toast.success("Note deleted");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <Card 
        className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-primary/5 hover:border-primary/20 bg-background/50 backdrop-blur-sm overflow-hidden flex flex-col h-full"
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
              {note.title}
            </CardTitle>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2 shrink-0 transition-colors"
                onClick={(e) => e.stopPropagation()}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin text-destructive" />
                ) : (
                  <Trash2 size={16} className="group-hover:text-destructive" />
                )}
              </Button>
            </AlertDialogTrigger>
          </div>
        </CardHeader>

        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              note and remove it from our AI indexing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Note"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
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
    </AlertDialog>
  );
}
