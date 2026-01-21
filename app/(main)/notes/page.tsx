import { createClient } from "@/lib/supabase/server";
import { NotesList } from "@/components/notes/notes-list";
import { redirect } from "next/navigation";

export default async function NotesPage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // If not logged in, redirect to signin
  if (authError || !user) {
    redirect("/signin");
  }

  // Fetch the user's notes directly on the server
  const { data: notes, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error);
    // You could handle this with a more elegant error UI later
    return <div className="p-8 text-center">Failed to load notes. Please try again later.</div>;
  }

  // Pass the data to the Client Component for interactivity (search, etc.)
  return <NotesList initialNotes={notes || []} />;
}
