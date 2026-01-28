"use client";

import { useState, useEffect } from "react";
import { createApiKey, revokeApiKey } from "@/app/actions/api-keys";
import { type ApiKey } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Copy, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { SCOPE_DESCRIPTIONS, API_SCOPES, SCOPE_PRESETS } from "@/lib/permissions";
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

import { useRouter } from "next/navigation";

interface ApiKeyManagerProps {
  initialKeys: ApiKey[];
}

export function ApiKeyManager({ initialKeys }: ApiKeyManagerProps) {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [isCreating, setIsCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null); // The plain text key to show once
  const [selectedScopes, setSelectedScopes] = useState<string[]>([...SCOPE_PRESETS.READ_ONLY]);

  // Sync state with server data on refresh
  useEffect(() => {
    setKeys(initialKeys);
  }, [initialKeys]);

  const handleCreate = async (formData: FormData) => {
    // Manually add scopes to formData since checkbox handling is custom
    selectedScopes.forEach(scope => formData.append("scopes", scope));
    
    setIsCreating(true);
    try {
      const result = await createApiKey(formData);
      if (result.success) {
        setNewKey(result.apiKey);
        toast.success("API Key created successfully");
        // We use router.refresh() to update the server component list without losing client state (the dialog)
        router.refresh(); 
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeApiKey(id);
      setKeys(keys.filter((k) => k.id !== id));
      toast.success("API Key revoked");
    } catch (error) {
      toast.error("Failed to revoke key");
    }
  };
  const { copy } = useCopyToClipboard();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New API Key</CardTitle>
          <CardDescription>
            Generate a new key to access your notes from external applications like Claude Desktop or Raycast.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Key Name</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="e.g. Claude Desktop, Work Laptop" 
                required 
              />
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-xl p-4 bg-muted/20">
                {Object.values(API_SCOPES).map((scope) => (
                  <label
                    key={scope}
                    htmlFor={scope}
                    className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                  >
                    <Checkbox 
                      id={scope} 
                      checked={selectedScopes.includes(scope)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedScopes([...selectedScopes, scope]);
                        } else {
                          setSelectedScopes(selectedScopes.filter(s => s !== scope));
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <span className="text-sm font-medium leading-none">
                        {scope}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {SCOPE_DESCRIPTIONS[scope]}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={isCreating || selectedScopes.length === 0}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Generate Key
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
          <CardDescription>
            Manage existing keys and their permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No API keys found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Permissions</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="hidden sm:table-cell">Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                            <span>{key.name}</span>
                            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded w-fit">
                                ...{key.keyHash.substring(0, 8)}
                            </span>
                            {/* Show permissions count on mobile as a hint */}
                            <span className="md:hidden text-[10px] text-muted-foreground">
                                {key.scopes?.length || 0} permissions
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes?.map((scope) => (
                          <span key={scope} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/30">
                            {scope.replace("notes:", "")}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {key.createdAt ? formatDistanceToNow(new Date(key.createdAt), { addSuffix: true }) : '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {key.lastUsedAt ? formatDistanceToNow(new Date(key.lastUsedAt), { addSuffix: true }) : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeleteConfirmDialog 
                        variant="icon"
                        title="Revoke API Key?"
                        description="This action cannot be undone. Any applications using this key will immediately lose access."
                        onConfirm={() => handleRevoke(key.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Key Display Dialog */}
      <Dialog open={!!newKey} onOpenChange={(open) => !open && setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                API Key Generated Successfully
            </DialogTitle>
            <DialogDescription>
              Save this key now - you won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 mt-4">
            <Label className="text-sm font-medium">Your API Key</Label>
            <div className="flex items-center space-x-2">
              <Input
                defaultValue={newKey || ""}
                readOnly
                className="font-mono text-xs"
              />
              <Button size="sm" className="px-3 shrink-0" onClick={() => newKey && copy(newKey)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter className="sm:justify-start">
            <div className="text-xs text-muted-foreground">
              <p>💡 <strong>Next step:</strong> Scroll up to copy the MCP configuration and replace <code className="bg-muted px-1 py-0.5 rounded">{"{API_KEY}"}</code> with this key.</p>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
