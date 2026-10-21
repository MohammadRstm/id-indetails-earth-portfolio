import { postContactMessage } from '../api/website';
import type { ContactMessage } from '../lib/contactForm';

/**
 * Single entry point for sending a contact message: the ID-Indetails API
 * emails it to the studio. A failure is an `ApiError` (`contactFailure` in
 * `lib/contactForm.ts` says what to tell the visitor).
 */
export const sendContactMessage = (message: ContactMessage, signal?: AbortSignal): Promise<void> => postContactMessage(message, signal);
