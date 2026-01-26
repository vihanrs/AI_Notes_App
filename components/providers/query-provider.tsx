"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
    // Create QueryClient inside useState to ensure it's only created once per client
    // This prevents creating a new client on every render
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // retry data fetch on failes 
                        retry:3,
                        // Don't refetch on window focus for this app - data only update with user actions
                        refetchOnWindowFocus: false,
                        // Keep data fresh for 5 minutes
                        staleTime: 5 * 60 * 1000,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
