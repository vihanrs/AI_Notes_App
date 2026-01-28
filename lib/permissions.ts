/**
 * API Key Permission Scopes
 * Defines granular access control for external MCP clients
 */

export const API_SCOPES = {
    NOTES_READ: "notes:read",
    NOTES_CREATE: "notes:create",
    NOTES_UPDATE: "notes:update",
    NOTES_DELETE: "notes:delete",
} as const;

export type ApiScope = (typeof API_SCOPES)[keyof typeof API_SCOPES];

/**
 * Maps tool names to required scopes
 */
export const TOOL_SCOPE_MAP: Record<string, ApiScope> = {
    "search-notes": API_SCOPES.NOTES_READ,
    "list-notes": API_SCOPES.NOTES_READ,
    "create-note": API_SCOPES.NOTES_CREATE,
    "update-note": API_SCOPES.NOTES_UPDATE,
    "delete-note": API_SCOPES.NOTES_DELETE,
};

/**
 * Scope descriptions for UI
 */
export const SCOPE_DESCRIPTIONS: Record<ApiScope, string> = {
    [API_SCOPES.NOTES_READ]: "Read and search your notes",
    [API_SCOPES.NOTES_CREATE]: "Create new notes",
    [API_SCOPES.NOTES_UPDATE]: "Modify existing notes",
    [API_SCOPES.NOTES_DELETE]: "Delete notes permanently",
};

/**
 * Predefined scope presets for common use cases
 */
export const SCOPE_PRESETS = {
    READ_ONLY: [API_SCOPES.NOTES_READ],
    CAPTURE_ONLY: [API_SCOPES.NOTES_READ, API_SCOPES.NOTES_CREATE],
    FULL_ACCESS: [
        API_SCOPES.NOTES_READ,
        API_SCOPES.NOTES_CREATE,
        API_SCOPES.NOTES_UPDATE,
        API_SCOPES.NOTES_DELETE,
    ],
} as const;

/**
 * Check if a set of scopes allows a specific tool
 */
export function hasToolPermission(
    userScopes: string[],
    toolName: string
): boolean {
    const requiredScope = TOOL_SCOPE_MAP[toolName];
    if (!requiredScope) return false;
    return userScopes.includes(requiredScope);
}
