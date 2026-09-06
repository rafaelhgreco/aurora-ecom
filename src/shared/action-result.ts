export type ActionResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: string;
      details?: Array<{ field: string; message: string }>;
    };
