interface ImportMetaEnv {
  /**
   * Where the public website API lives. Defaults to `/api/public/website` on
   * the site's own origin; set an absolute URL when the API is on another
   * origin (see `.env.example`).
   */
  readonly VITE_API_BASE_URL?: string;
}
