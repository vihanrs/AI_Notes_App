import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";

/**
 * Get the authenticated user from the current session
 * Used by Server Actions (Next.js context)
 * @throws Error if user is not authenticated
 */
export async function getAuthenticatedUser(): Promise<User> {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    return user;
}
