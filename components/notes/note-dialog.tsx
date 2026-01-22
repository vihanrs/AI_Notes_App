"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createNoteAction, updateNoteAction } from "@/app/actions/notes";

const noteFormSchema = z.object({
  title: z.string().min(1, {
    message: "Title cannot be empty.",
  }),
  body: z.string().min(1, {
    message: "Body cannot be empty.",
  }),
});

interface Note {
  id: string;
  title: string;
  body: string;
  source: string;
  created_at: string;
}

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: Note; // If provided, we are in "Edit" mode
}

export function NoteDialog({ open, onOpenChange, note }: NoteDialogProps) {
  const [loading, setLoading] = useState(false);

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

  async function onSubmit(values: z.infer<typeof noteFormSchema>) {
    setLoading(true);
    try {
      if (note) {
        await updateNoteAction(note.id, values.title, values.body);
        toast.success("Note updated successfully!");
      } else {
        await createNoteAction(values.title, values.body);
        toast.success("Note created successfully!");
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
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
            <DialogFooter className="gap-2 sm:gap-0">
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
