import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './errors';
import { apiProject } from './fixtures';
import { getContactInfo, getProject, getProjects, postContactMessage } from './website';

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function stubFetch(response: Response | Error) {
  const fetchMock = vi.fn((input: string, init?: RequestInit) => {
    void input;
    void init;
    return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('website API client', () => {
  it('reads the projects from the public website API', async () => {
    const fetchMock = stubFetch(json(200, [apiProject]));
    const projects = await getProjects();
    expect(projects.map((project) => project.slug)).toEqual(['aegean-cliff-villa']);
    expect(fetchMock).toHaveBeenCalledWith('/api/public/website/projects', expect.objectContaining({ headers: { Accept: 'application/json' } }));
  });

  it('asks for one project by its slug, escaped', async () => {
    const fetchMock = stubFetch(json(200, apiProject));
    await getProject('aegean-cliff-villa');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/public/website/projects/aegean-cliff-villa');
  });

  it('turns an error reply into an ApiError', async () => {
    stubFetch(json(404, { code: 'not_found', message: 'No such project.' }));
    await expect(getProject('missing')).rejects.toMatchObject({ status: 404, code: 'not_found', message: 'No such project.' });
  });

  it('reports a server it cannot reach as a network error', async () => {
    stubFetch(new TypeError('Failed to fetch'));
    await expect(getContactInfo()).rejects.toMatchObject({ status: 0, code: 'network_error' });
  });

  it('reports a reply it cannot read as a bad response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetch(json(200, { email: 42 }));
    await expect(getContactInfo()).rejects.toMatchObject({ code: 'bad_response' });
  });

  it('lets an abort through as an abort', async () => {
    stubFetch(new DOMException('Aborted', 'AbortError'));
    await expect(getProjects()).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('posts the contact form as JSON, honeypot included, and accepts 202', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 202 }));
    const message = { name: 'Rana', email: 'rana@example.com', phone: '', message: 'A villa near Batroun.', website: '' };
    await expect(postContactMessage(message)).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/public/website/contact-messages');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual(message);
  });

  it('passes field errors back from a rejected contact form', async () => {
    stubFetch(json(400, { code: 'validation_failed', message: 'Check the form.', errors: { email: ['Enter a valid email.'] } }));
    const error = await postContactMessage({ name: 'R', email: 'x', phone: '', message: 'A villa near Batroun.', website: '' }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).fieldErrors.email).toEqual(['Enter a valid email.']);
  });
});
