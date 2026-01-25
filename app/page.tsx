import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BrainCircuit, Sparkles, Shield, ArrowRight, Github } from "lucide-react";
import { DemoButton } from "@/components/demo-button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b border-primary/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <Link className="flex items-center justify-center gap-2 group" href="#">
          <div className="bg-primary p-1.5 rounded-lg text-primary-foreground transition-transform group-hover:scale-110">
            <BrainCircuit size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">SmartNotes</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/signin">
            Sign In
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-full shadow-lg shadow-primary/20">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
            <div className="absolute top-[-10%] left-[20%] w-[30%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[20%] w-[30%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
          </div>
          
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4 animate-bounce">
                  <Sparkles size={14} className="mr-2" />
                  AI-Powered Note Taking
                </div>
                <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
                  Your Thoughts, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Augmented by AI</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl lg:text-2xl font-medium leading-relaxed">
                  The next generation note-taking app that understands your content. Chat with your notes, get summaries, and find information instantly.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 min-w-[300px] justify-center items-center">
                <Link href="/signup">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-2xl shadow-primary/30 transition-all hover:scale-105 group">
                    Start Free Trial
                    <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" size={18} />
                  </Button>
                </Link>
                <DemoButton />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-3xl bg-background shadow-sm border border-primary/5 transition-all hover:shadow-md hover:-translate-y-1">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <BrainCircuit size={32} />
                </div>
                <h3 className="text-xl font-bold">Semantic Search</h3>
                <p className="text-muted-foreground">Search by meaning, not just keywords. Our AI finds exactly what you&apos;re looking for across all your notes.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-3xl bg-background shadow-sm border border-primary/5 transition-all hover:shadow-md hover:-translate-y-1">
                <div className="p-3 bg-green-500/10 rounded-2xl text-green-600">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-xl font-bold">AI Chatbot</h3>
                <p className="text-muted-foreground">A dedicated AI companion that has read all your notes. Ask questions, get summaries, and brainstorm ideas.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-3xl bg-background shadow-sm border border-primary/5 transition-all hover:shadow-md hover:-translate-y-1">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600">
                  <Shield size={32} />
                </div>
                <h3 className="text-xl font-bold">Secure & Private</h3>
                <p className="text-muted-foreground">Your notes are stored securely in Supabase. You have full control over your data at all times.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 border-t border-primary/10">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-primary/10 rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 border border-primary/20 relative overflow-hidden">
               <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
              <div className="space-y-4 z-10">
                <h2 className="text-3xl font-bold md:text-4xl lg:text-5xl tracking-tight">Ready to supercharge <br />your memory?</h2>
                <p className="text-muted-foreground text-lg md:text-xl">Join thousands of users who are already using SmartNotes.</p>
              </div>
              <div className="flex flex-col gap-4 z-10 w-full md:w-auto">
                <Link href="/signup">
                  <Button size="lg" className="rounded-full h-14 px-8 w-full md:w-auto">Create Free Account</Button>
                </Link>
                <DemoButton />
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted" />
                    ))}
                  </div>
                  <span>Supported by 500+ developers</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 border-t border-primary/5 px-4 md:px-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-1 rounded-md text-primary-foreground">
                <BrainCircuit size={16} />
              </div>
              <span className="font-bold">SmartNotes</span>
            </div>
            <p className="text-sm text-muted-foreground text-center md:text-left">© {new Date().getFullYear()} SmartNotes Inc. All rights reserved.</p>
          </div>
          <div className="flex gap-4 sm:gap-6">
            <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground" href="#">
              Terms of Service
            </Link>
            <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground" href="#">
              Privacy
            </Link>
            <Link className="text-xs hover:underline underline-offset-4 text-muted-foreground hover:text-foreground" href="#">
              <Github size={16} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
