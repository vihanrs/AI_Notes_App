"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createNoteAction, updateNoteAction, deleteNoteAction } from "@/app/actions/notes";
import { Note } from "@/lib/db";
import { toast } from "sonner";
import { useEffect } from "react";

// Query key for notes - used to identify the cache
export const NOTES_QUERY_KEY = ["notes"] as const;

// Types for mutation inputs
type CreateNoteInput = { title: string; body: string };
type UpdateNoteInput = { noteId: string; title: string; body: string };
type DeleteNoteInput = { noteId: string };

export function useNotes(initialNotes: Note[]) {
    const queryClient = useQueryClient();

    // Use useQuery to make notes reactive - this will re-render when cache changes
    const { data: notes = initialNotes } = useQuery({
        queryKey: NOTES_QUERY_KEY,
        queryFn: () => initialNotes,
        initialData: initialNotes,
        staleTime: Infinity,
    });

    // 🔄 SYNC: When initialNotes changes from the server (after router.refresh), 
    // update the React Query cache so the UI reflects the server state.
    useEffect(() => {
        queryClient.setQueryData(NOTES_QUERY_KEY, initialNotes);
    }, [initialNotes, queryClient]);

    // ============ CREATE NOTE MUTATION ============
    const createMutation = useMutation({
        mutationFn: async ({ title, body }: CreateNoteInput) => {
            const result = await createNoteAction(title, body);
            if (!result.success) throw new Error("Failed to create note");
            return result.note;
        },

        // Optimistic update: Add note immediately with temporary ID
        onMutate: async ({ title, body }) => {
            // Cancel any in-flight queries to prevent race conditions
            await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });

            // Save current state for potential rollback
            const previousNotes = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY) ?? [];

            // Create optimistic note with temporary data
            const optimisticNote: Note = {
                id: `temp-${Date.now()}`, // Temporary ID
                title,
                body,
                userId: "", // Will be set by server
                source: "local",
                sourceId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Add to cache immediately (at the beginning of the list)
            queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, [optimisticNote, ...previousNotes]);

            // Return context for rollback
            return { previousNotes };
        },

        // On error: Rollback to previous state
        onError: (error, variables, context) => {
            if (context?.previousNotes) {
                queryClient.setQueryData(NOTES_QUERY_KEY, context.previousNotes);
            }
            toast.error("Failed to create note");
        },

        // On success: Replace temp note with real note from server
        onSuccess: (newNote) => {
            queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (old) => {
                if (!old) return [newNote];
                // Replace the temp note with the real one
                return old.map((note) =>
                    note.id.startsWith("temp-") ? newNote : note
                );
            });
            toast.success("Note created!");
        },
    });

    // ============ UPDATE NOTE MUTATION ============
    const updateMutation = useMutation({
        mutationFn: async ({ noteId, title, body }: UpdateNoteInput) => {
            const result = await updateNoteAction(noteId, title, body);
            if (!result.success) throw new Error("Failed to update note");
            return { noteId, title, body };
        },

        // Optimistic update: Update note immediately
        onMutate: async ({ noteId, title, body }) => {
            await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });

            const previousNotes = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY) ?? [];

            // Update the note in cache immediately
            queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (old) =>
                old?.map((note) =>
                    note.id === noteId
                        ? { ...note, title, body, updatedAt: new Date() }
                        : note
                ) ?? []
            );

            return { previousNotes };
        },

        onError: (error, variables, context) => {
            if (context?.previousNotes) {
                queryClient.setQueryData(NOTES_QUERY_KEY, context.previousNotes);
            }
            toast.error("Failed to update note");
        },

        onSuccess: () => {
            toast.success("Note updated!");
        },
    });

    // ============ DELETE NOTE MUTATION ============
    const deleteMutation = useMutation({
        mutationFn: async ({ noteId }: DeleteNoteInput) => {
            const result = await deleteNoteAction(noteId);
            if (!result.success) throw new Error("Failed to delete note");
            return noteId;
        },

        // Optimistic update: Remove note immediately
        onMutate: async ({ noteId }) => {
            await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });

            const previousNotes = queryClient.getQueryData<Note[]>(NOTES_QUERY_KEY) ?? [];

            // Remove the note from cache immediately
            queryClient.setQueryData<Note[]>(NOTES_QUERY_KEY, (old) =>
                old?.filter((note) => note.id !== noteId) ?? []
            );

            return { previousNotes };
        },

        onError: (error, variables, context) => {
            if (context?.previousNotes) {
                queryClient.setQueryData(NOTES_QUERY_KEY, context.previousNotes);
            }
            toast.error("Failed to delete note");
        },

        onSuccess: () => {
            toast.success("Note deleted!");
        },
    });

    return {
        // Current notes from cache (reactive via useQuery)
        notes,

        // Mutation functions
        createNote: createMutation.mutate,
        updateNote: updateMutation.mutate,
        deleteNote: deleteMutation.mutate,

        // Loading states
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
