"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Note } from "@/lib/db";

const noteFormSchema = z.object({
  title: z.string().min(1, {
    message: "Title cannot be empty.",
  }),
  body: z.string().min(1, {
    message: "Body cannot be empty.",
  }),
});

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note; // If provided, we are in "Edit" mode
  // React Query mutation functions (passed from parent)
  onCreateNote: (data: { title: string; body: string }) => void;
  onUpdateNote: (data: { noteId: string; title: string; body: string }) => void;
  onDeleteNote: (data: { noteId: string }) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function NoteDialog({
  open,
  onOpenChange,
  note,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  isCreating,
  isUpdating,
  isDeleting,
}: NoteDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const form = useForm<z.infer<typeof noteFormSchema>>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      body: "",
    },
  });

  // Reset form with note values when note changes or dialog opens
  useEffect(() => {
    if (note) {
      form.reset({
        title: note.title,
        body: note.body,
      });
    } else {
      form.reset({
        title: "",
        body: "",
      });
    }
  }, [note, open, form]);

  // Combined loading state from mutations
  const loading = isCreating || isUpdating || isDeleting;

  function onSubmit(values: z.infer<typeof noteFormSchema>) {
    if (note) {
      // Update existing note using React Query mutation
      onUpdateNote({ noteId: note.id, title: values.title, body: values.body });
    } else {
      // Create new note using React Query mutation
      onCreateNote({ title: values.title, body: values.body });
    }

    form.reset();
    onOpenChange(false);
  }

  function handleDelete() {
    if (note) {
      onDeleteNote({ noteId: note.id });
      onOpenChange(false);
    }
  }

  const isEdit = !!note;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEdit ? "Edit Note" : "Create New Note"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Update your note. Changes will be re-indexed by AI."
              : "Add a new note to your collection. AI will automatically index it for smart searching."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Note title" 
                      {...field} 
                      className="bg-muted/30 focus-visible:ring-primary/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Start writing..." 
                      className="min-h-[200px] resize-none bg-muted/30 focus-visible:ring-primary/50"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex justify-between sm:justify-between">
              {/* Delete button - only show in edit mode */}
              {isEdit ? (
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={loading}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        note and remove it from AI indexing.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Note
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <div /> // Spacer for layout
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="min-w-[100px]">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEdit ? "Updating..." : "Saving..."}
                    </>
                  ) : (
                    isEdit ? "Update Note" : "Save Note"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
