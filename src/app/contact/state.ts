import type { ContactSubmission, FieldErrors } from "@/lib/contact/schema";

/** Echoed back to the visitor's own browser to prefill the Cal.com booking step. */
export type Booker = { name: string; email: string };

export type ContactState =
  | { status: "idle" }
  | { status: "success"; confirmed?: boolean; booker?: Booker }
  | { status: "error"; message: string; fieldErrors?: FieldErrors; values?: Partial<ContactSubmission> };

export const initialContactState: ContactState = { status: "idle" };
