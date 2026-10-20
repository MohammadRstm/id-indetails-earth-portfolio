import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/errors';
import { sendContactMessage } from './contactSource';

const message = { name: 'Rana', email: 'rana@example.com', phone: '', message: 'A villa near Batroun.', website: '' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sendContactMessage', () => {
  it('posts the message to the website API', async () => {
    const fetchMock = vi.fn((input: string, init?: RequestInit) => {
      void input;
      void init;
      return Promise.resolve(new Response(null, { status: 202 }));
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(sendContactMessage(message)).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/public/website/contact-messages');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(message);
  });

  it('fails with the API error, so the form can say why', async () => {
    const body = { code: 'website_contact_unavailable', message: "Messages can't be sent right now." };
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(JSON.stringify(body), { status: 503 })));
    const error = await sendContactMessage(message).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('website_contact_unavailable');
  });

  it('rejects with an AbortError when aborted', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new DOMException('Aborted', 'AbortError')));
    const controller = new AbortController();
    controller.abort();
    await expect(sendContactMessage(message, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
