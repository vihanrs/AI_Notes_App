import { listApiKeys } from "@/app/actions/api-keys";
import { ApiKeyManager } from "@/components/settings/api-key-manager";
import { MCPConfigCard } from "@/components/settings/mcp-config-card";
import { Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const keys = await listApiKeys();

  return (
    <div className="container mx-auto max-w-4xl py-10 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and API access.
        </p>
      </div>

      <div className="grid gap-8">
        {/* MCP Connection Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Connect MCP Clients</h2>
          </div>
          
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground mb-4">
            <p>
              Use this configuration to connect external MCP clients like Claude Desktop or Cursor to your SmartNotes.
              Replace <code>{"{API_KEY}"}</code> with an API key generated below.
            </p>
          </div>

          <MCPConfigCard />
        </section>

        {/* API Keys Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">API Keys</h2>
          </div>
          
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground mb-6">
            <p>
              Create long-lived API keys to authenticate external MCP clients (like Claude Desktop) with your SmartNotes account. 
              These keys allow third-party tools to securely access your notes without needing a browser session.
            </p>
          </div>

          <ApiKeyManager initialKeys={keys} />
        </section>

      </div>
    </div>
  );
}
