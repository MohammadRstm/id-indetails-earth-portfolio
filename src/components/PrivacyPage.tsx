import { analyticsConfigured } from '../analytics/analytics';

/**
 * PLACEHOLDER: the company's own details and choices, to be confirmed (and
 * ideally checked by whoever advises the company on data protection) before
 * the site goes live. Everything else on the page describes what the site
 * actually does.
 */
const NOTICE = {
  updated: '[Date of this version]',
  legalName: '[Company legal name]',
  address: '[Registered address]',
  contactEmail: '[privacy contact email]',
  mailboxRetention: '[how long enquiries are kept, e.g. two years after our last exchange]',
  rightsLaw:
    '[The data protection law that applies to the company and its visitors, e.g. Lebanon’s Law No. 81 of 2018 and, for visitors in the EU or UK, the GDPR]',
};

/** What the website collects, why, and the visitor's choices. */
export function PrivacyPage({ onCookieSettings }: { onCookieSettings?: () => void }) {
  return (
    <main className="page" id="content">
      <header className="page__intro">
        <p className="eyebrow page__eyebrow">Privacy</p>
        <h1 className="page__title">How this website uses your information.</h1>
        <p className="page__lead">
          What the ID-Indetails website collects, why, and the choices you have. Last updated {NOTICE.updated}.
        </p>
      </header>

      <div className="privacy">
        <section className="privacy__section" aria-labelledby="privacy-who">
          <h2 className="section-title" id="privacy-who">
            Who we are
          </h2>
          <p>
            This website belongs to {NOTICE.legalName}, {NOTICE.address}. For anything about your information, write to{' '}
            {NOTICE.contactEmail}.
          </p>
        </section>

        <section className="privacy__section" aria-labelledby="privacy-messages">
          <h2 className="section-title" id="privacy-messages">
            Messages you send us
          </h2>
          <p>
            When you use the contact form we receive your name, your email address, your phone number if you give one, and your
            message. They are emailed to our studio so that we can reply; the website itself doesn’t keep them. We keep enquiries in
            our mailbox for {NOTICE.mailboxRetention}, unless we go on to work together.
          </p>
        </section>

        <section className="privacy__section" aria-labelledby="privacy-statistics">
          <h2 className="section-title" id="privacy-statistics">
            Visit statistics
          </h2>
          <p>
            Only if you accept, we use Google Analytics to count visits and see which pages are useful. It records the pages you view,
            how you arrived (a search engine or a link, for example), your type of device and browser, and your approximate location
            (country and city, worked out from your internet address, which Google Analytics doesn’t keep).
          </p>
          <p>
            We also count a few actions: sending the contact form, opening our email address or a phone number, and the “Contact us”
            buttons. We never send what you type, your name or your contact details. Google’s advertising features and Google signals
            are switched off. The statistics are kept for 14 months.
          </p>
          <p>
            Google provides the service and may process this information outside your country. See{' '}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
              how Google uses information from sites that use its services
            </a>
            .
          </p>
        </section>

        <section className="privacy__section" aria-labelledby="privacy-cookies">
          <h2 className="section-title" id="privacy-cookies">
            Cookies and storage
          </h2>
          <div className="privacy__table-wrap">
            <table className="privacy__table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">What it is for</th>
                  <th scope="col">How long</th>
                  <th scope="col">When</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>idi-analytics-consent</code>
                  </td>
                  <td>Remembers your answer to the cookie question, kept in your browser’s storage</td>
                  <td>One year</td>
                  <td>Once you answer</td>
                </tr>
                <tr>
                  <td>
                    <code>_ga</code>, <code>_ga_…</code>
                  </td>
                  <td>Google Analytics: tells one visit from another</td>
                  <td>Up to two years</td>
                  <td>Only if you accept</td>
                </tr>
                <tr>
                  <td>Google Maps</td>
                  <td>The maps on the Contact page are Google’s, and Google may set its own cookies</td>
                  <td>Set by Google</td>
                  <td>When the Contact page’s maps load</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="privacy__section" aria-labelledby="privacy-choices">
          <h2 className="section-title" id="privacy-choices">
            Your choices
          </h2>
          <p>
            You can change your answer at any time from “Cookie settings” at the bottom of every page; declining removes Google
            Analytics’ cookies from this site. If your browser sends a Global Privacy Control signal, we take it as a no. You can also
            block or delete cookies in your browser’s settings.
          </p>
          {analyticsConfigured && onCookieSettings && (
            <button type="button" className="button button--outline privacy__settings" onClick={onCookieSettings}>
              Cookie settings
            </button>
          )}
        </section>

        <section className="privacy__section" aria-labelledby="privacy-rights">
          <h2 className="section-title" id="privacy-rights">
            Your rights
          </h2>
          <p>
            Under {NOTICE.rightsLaw}, you may ask to see the information we hold about you, to correct it or delete it, and to object to
            how we use it. Write to {NOTICE.contactEmail}.
          </p>
          <p>We update this notice when anything changes; the date at the top shows the current version.</p>
        </section>
      </div>
    </main>
  );
}
