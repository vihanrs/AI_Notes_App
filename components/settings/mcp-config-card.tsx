"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

export function MCPConfigCard() {
  const { copy, copied } = useCopyToClipboard();

  const mcpConfig = `{
  "mcpServers": {
    "smart-notes": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/mcp"],
      "env": {
        "AUTHORIZATION": "Bearer {API_KEY}"
      }
    }
  }
}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle>MCP Server Configuration</CardTitle>
            <CardDescription>
              Copy this configuration to connect external MCP clients
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy(mcpConfig)}
            className="gap-2 shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy Config
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>📁 <strong>Claude Desktop:</strong> <code className="bg-muted px-1 py-0.5 rounded">~/.config/claude/claude_desktop_config.json</code></p>
          <p>📁 <strong>Cursor:</strong> <code className="bg-muted px-1 py-0.5 rounded">~/.cursor/mcp_config.json</code></p>
        </div>

        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border font-mono">
          <code>{mcpConfig}</code>
        </pre>

        <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">💡 Setup Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200">
            <li>Generate an API key in the section below</li>
            <li>Replace <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{"{API_KEY}"}</code> with your actual key</li>
            <li>Add this config to your MCP client's configuration file</li>
            <li>Restart your MCP client to connect</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
