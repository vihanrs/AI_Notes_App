"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface DeleteConfirmDialogProps {
  onConfirm: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  title?: string;
  description?: string;
  variant?: "default" | "icon";
}

export function DeleteConfirmDialog({
  onConfirm,
  disabled = false,
  isLoading = false,
  title = "Are you sure?",
  description = "This action cannot be undone. This will permanently delete your note and remove it from AI indexing.",
  variant = "default",
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  function handleConfirm() {
    onConfirm();
    setOpen(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {variant === "icon" ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2 shrink-0 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin text-destructive" />
          ) : (
            <Trash2 size={16} />
          )}
        </Button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          onClick={() => setOpen(true)}
          disabled={disabled || isLoading}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      )}
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.stopPropagation();
              handleConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
