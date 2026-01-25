import { createClient } from "@/lib/supabase/server";
import { db, notes } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { NotesList } from "@/components/notes/notes-list";
import { redirect } from "next/navigation";

export default async function NotesPage() {
  const supabase = await createClient();

  // Get authenticated user by using Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If not logged in, redirect to signin
  if (authError || !user) {
    redirect("/signin");
  }

  // Fetch the user's notes using Drizzle
  let userNotes;
  try {
    userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id))
      .orderBy(desc(notes.createdAt));
  } catch (error) {
    console.error("Error fetching notes:", error);
    return <div className="p-8 text-center">Failed to load notes. Please try again later.</div>;
  }

  // Pass the data to the Client Component for interactivity (search, etc.)
  return <NotesList initialNotes={userNotes} />;
}
