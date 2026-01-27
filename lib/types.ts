/**
 * Generic result type for AI Tools and Server Actions.
 * T is the shape of the successful data payload.
 */
export type ActionResult<T = {}> =
    | ({ success: true; message: string } & T)
    | { success: false; error: string; debug?: string[] };
