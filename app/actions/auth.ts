"use server";

import { createClient } from "@/lib/supabase/server";

export async function demoLoginAction() {
    const supabase = await createClient();

    const email = process.env.DEMO_EMAIL;
    const password = process.env.DEMO_PASSWORD;

    if (!email || !password) {
        throw new Error("Demo credentials are not configured in environment variables.");
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
}
