"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { demoLoginAction } from "@/app/actions/auth";

export function DemoButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      const result = await demoLoginAction();
      
      if (result.success) {
        toast.success("Welcome to the Demo!");
        router.push("/notes");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Demo login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="lg" 
      onClick={handleDemoLogin}
      disabled={isLoading}
      className="h-14 px-8 text-lg rounded-full border-primary/20 hover:bg-primary/5 transition-all hover:scale-105 group bg-background/50 backdrop-blur-sm"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
      ) : (
        <Play className="mr-2 fill-primary text-primary transition-transform group-hover:scale-110" size={18} />
      )}
      {isLoading ? "Preparing Demo..." : "Try Live Demo"}
    </Button>
  );
}
