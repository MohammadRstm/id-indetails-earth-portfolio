import { describe, expect, it } from 'vitest';
import { ContactNotConnectedError, sendContactMessage } from './contactSource';

const message = { name: 'Rana', email: 'rana@example.com', phone: '', message: 'A villa near Batroun.' };

describe('sendContactMessage', () => {
  it('reports that it is not connected yet, rather than pretending to send', async () => {
    await expect(sendContactMessage(message)).rejects.toBeInstanceOf(ContactNotConnectedError);
  });

  it('rejects with an AbortError when already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(sendContactMessage(message, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
