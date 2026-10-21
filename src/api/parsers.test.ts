import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveAssetUrl } from './config';
import { apiErrorFrom } from './errors';
import { apiProject } from './fixtures';
import {
  ParseError,
  parseContactInfo,
  parseList,
  parseLocation,
  parseProject,
  parseService,
  parseSiteSettings,
  parseSocialLink,
} from './parsers';

afterEach(() => vi.restoreAllMocks());

describe('parseProject', () => {
  it('reads a project as the API sends it', () => {
    const project = parseProject(apiProject);
    expect(project.slug).toBe('aegean-cliff-villa');
    expect(project.location.lat).toBe(37.4467);
    expect(project.location.countryCode).toBe('GR');
    expect(project.location.approximate).toBe(false);
    expect(project.hero).toEqual({ src: '/api/public/website/files/2', alt: 'The villa' });
    expect(project.showInConveyor).toBe(true);
    expect(project.conveyorOrder).toBe(3);
  });

  it('reads a project with no concept as having none', () => {
    const project = parseProject(apiProject);
    expect(project.conceptDescription).toBeNull();
    expect(project.conceptImages).toEqual([]);
    expect(parseProject({ ...apiProject, conceptDescription: '  ', conceptImages: [] }).conceptDescription).toBeNull();
  });

  it('reads the concept: its text, and at most five pictures in order', () => {
    const pictures = Array.from({ length: 7 }, (_, index) => ({ src: `/api/public/website/files/${20 + index}`, alt: `Sketch ${index + 1}` }));
    const project = parseProject({ ...apiProject, conceptDescription: 'Courtyards first.', conceptImages: pictures });
    expect(project.conceptDescription).toBe('Courtyards first.');
    expect(project.conceptImages.map((picture) => picture.alt)).toEqual(['Sketch 1', 'Sketch 2', 'Sketch 3', 'Sketch 4', 'Sketch 5']);
  });

  it('accepts an empty client and a project outside the strip', () => {
    const project = parseProject({ ...apiProject, client: '', showInConveyor: false, conveyorOrder: null });
    expect(project.client).toBe('');
    expect(project.conveyorOrder).toBeNull();
  });

  it('accepts a project known only by its country, at a point the API picked', () => {
    const project = parseProject({ ...apiProject, location: { ...apiProject.location, city: null, approximate: true } });
    expect(project.location.city).toBeNull();
    expect(project.location.country).toBe('Greece');
    expect(project.location.approximate).toBe(true);
  });

  it('rejects what the site cannot show', () => {
    const broken = [
      { ...apiProject, slug: 'Not A Slug' },
      { ...apiProject, slug: 'a'.repeat(101) },
      { ...apiProject, type: 'castle' },
      { ...apiProject, status: 'paused' },
      { ...apiProject, location: { ...apiProject.location, lat: 120 } },
      { ...apiProject, location: { ...apiProject.location, lng: 'east' } },
      { ...apiProject, location: { ...apiProject.location, countryCode: 'Greece' } },
      { ...apiProject, location: { ...apiProject.location, countryCode: 'gr' } },
      { ...apiProject, location: { ...apiProject.location, approximate: 'no' } },
      { ...apiProject, thumbnail: '' },
      { ...apiProject, hero: null },
      { ...apiProject, gallery: 'none' },
      { ...apiProject, conceptImages: 'none' },
      { ...apiProject, conceptImages: [{ alt: 'no picture' }] },
      { ...apiProject, conceptDescription: 42 },
      'not a project',
    ];
    for (const value of broken) expect(() => parseProject(value), JSON.stringify(value)).toThrow(ParseError);
  });
});

describe('parseList', () => {
  it('drops the rows that do not fit and keeps the rest', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const projects = parseList([apiProject, { ...apiProject, slug: 'bad slug' }], parseProject, 'project');
    expect(projects).toHaveLength(1);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('rejects anything that is not a list', () => {
    expect(() => parseList({ items: [] }, parseProject, 'project')).toThrow(ParseError);
  });
});

describe('the other shapes', () => {
  it('reads services, locations, social links, contact and settings', () => {
    expect(parseService({ id: 1, title: 'Architecture', description: 'Buildings.' })).toEqual({ id: 1, title: 'Architecture', description: 'Buildings.' });
    expect(
      parseLocation({ id: 2, city: 'Beirut', country: 'Lebanon', countryCode: 'LB', lat: 33.89, lng: 35.5, address: '', phone: '+961 1' }),
    ).toMatchObject({ city: 'Beirut', countryCode: 'LB' });
    expect(parseSocialLink({ id: 3, label: 'Instagram', url: 'https://www.instagram.com/x' }).label).toBe('Instagram');
    expect(parseContactInfo({ email: 'studio@example.com' })).toEqual({ email: 'studio@example.com' });
    expect(parseSiteSettings({ faviconUrl: '/api/public/website/files/9', underConstruction: true })).toEqual({
      faviconUrl: '/api/public/website/files/9',
      underConstruction: true,
    });
  });

  it('accepts a contact email and a favicon that are not set yet', () => {
    expect(parseContactInfo({ email: null })).toEqual({ email: null });
    expect(parseSiteSettings({ faviconUrl: null, underConstruction: false })).toEqual({ faviconUrl: null, underConstruction: false });
  });

  it('reads settings from an API that has no under-construction switch yet as switched off', () => {
    expect(parseSiteSettings({ faviconUrl: null })).toEqual({ faviconUrl: null, underConstruction: false });
  });

  it('refuses an under-construction flag that is not true or false', () => {
    expect(() => parseSiteSettings({ faviconUrl: null, underConstruction: 'yes' })).toThrow(ParseError);
  });

  it('refuses links that are not web addresses', () => {
    expect(() => parseSocialLink({ id: 3, label: 'Bad', url: 'javascript:alert(1)' })).toThrow(ParseError);
  });
});

describe('resolveAssetUrl', () => {
  it('leaves paths alone when the API is on the same origin', () => {
    expect(resolveAssetUrl('/api/public/website/files/1', '/api/public/website')).toBe('/api/public/website/files/1');
  });

  it('resolves API paths against an API on another origin', () => {
    expect(resolveAssetUrl('/api/public/website/files/1', 'https://api.example.com/api/public/website')).toBe(
      'https://api.example.com/api/public/website/files/1',
    );
  });

  it('leaves absolute addresses alone', () => {
    expect(resolveAssetUrl('https://cdn.example.com/a.jpg', 'https://api.example.com/api')).toBe('https://cdn.example.com/a.jpg');
  });
});

describe('apiErrorFrom', () => {
  it('reads the API error shape, including field errors', () => {
    const error = apiErrorFrom(400, {
      type: 'Validation',
      code: 'validation_failed',
      message: 'Check the form.',
      errors: { email: ['Enter a valid email.'] },
      traceId: 'abc',
    });
    expect(error.status).toBe(400);
    expect(error.code).toBe('validation_failed');
    expect(error.fieldErrors.email).toEqual(['Enter a valid email.']);
    expect(error.traceId).toBe('abc');
    expect(error.isValidation).toBe(true);
  });

  it('copes with a reply that is not the API error shape', () => {
    const error = apiErrorFrom(502, '<html>Bad gateway</html>');
    expect(error.code).toBe('http_error');
    expect(error.isValidation).toBe(false);
  });
});
