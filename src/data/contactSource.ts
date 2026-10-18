import type { ContactMessage } from '../lib/contactForm';

/** Raised until the form is connected to the ID-Indetails server, so the page can say so honestly. */
export class ContactNotConnectedError extends Error {
  constructor() {
    super('The contact form is not connected to a server yet.');
    this.name = 'ContactNotConnectedError';
  }
}

/**
 * Single entry point for sending a contact message. It is not connected yet:
 * replace the body with a request to the ID-Indetails server (for example a
 * POST of the message as JSON, passing `signal` on) and every caller stays as
 * is. Until then it always fails, and the form tells the visitor to email
 * instead, so no message is ever silently lost.
 */
export async function sendContactMessage(message: ContactMessage, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  void message;
  throw new ContactNotConnectedError();
}
