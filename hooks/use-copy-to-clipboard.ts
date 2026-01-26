"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

export function useCopyToClipboard() {
    const [copied, setCopied] = useState(false)

    const copy = useCallback(
        async (text: string) => {
            if (!navigator?.clipboard) {
                toast.error("Clipboard not supported")
                return
            }

            try {
                await navigator.clipboard.writeText(text)
                setCopied(true)
                toast.success("Copied to clipboard")
                setTimeout(() => setCopied(false), 2000)
            } catch (error) {
                console.error("Failed to copy:", error)
                toast.error("Failed to copy")
            }
        }, [])

    return { copy, copied }
}
