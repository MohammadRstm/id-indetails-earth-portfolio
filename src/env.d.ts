interface ImportMetaEnv {
  /**
   * Where the public website API lives. Defaults to `/api/public/website` on
   * the site's own origin; set an absolute URL when the API is on another
   * origin (see `.env.example`).
   */
  readonly VITE_API_BASE_URL?: string;
  /**
   * The Google Analytics 4 measurement ID (`G-…`), set only for the
   * production build. Without it nothing is tracked and no cookie question
   * is asked.
   */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}
