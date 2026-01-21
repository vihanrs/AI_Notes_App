"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { LogOut, StickyNote, BrainCircuit } from "lucide-react";
import { toast } from "sonner";

export function Navbar() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/notes"
          className="flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity"
        >
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground">
            <BrainCircuit size={20} />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            SmartNotes
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="gap-2 border-primary/20 hover:bg-primary/5"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
