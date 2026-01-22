"use client";

import { Navbar } from "@/components/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/5">
        {children}
      </main>
    </div>
  );
}
