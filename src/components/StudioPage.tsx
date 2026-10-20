import { track } from '../analytics/analytics';
import { offices } from '../data/offices';
import { services } from '../data/site';
import { ArrowRightIcon } from './icons';

const pad = (value: number) => String(value).padStart(2, '0');

/** The studio and what it does. */
export function StudioPage({ onContact }: { onContact: () => void }) {
  return (
    <main className="page" id="content">
      <header className="page__intro">
        <p className="eyebrow page__eyebrow">Studio</p>
        <h1 className="page__title">An architecture studio designing homes, hotels and residences around the world.</h1>
        <p className="page__lead">
          We work from the first sketch to the last detail: architecture, interiors and landscape, shaped by each site’s climate,
          light and craft. Our studios are in {offices.map((office) => office.city).join(' and ')}.
        </p>
      </header>

      <section className="page__section" aria-labelledby="services-title">
        <h2 className="section-title" id="services-title">
          What we do
        </h2>
        <ol className="services">
          {services.map((service, index) => (
            <li key={service.title} className="service">
              <span className="service__number" aria-hidden="true">
                {pad(index + 1)}
              </span>
              <h3 className="service__title">{service.title}</h3>
              <p className="service__text">{service.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <aside className="enquiry page__enquiry" aria-labelledby="studio-enquiry-title">
        <h2 id="studio-enquiry-title">Have a project in mind?</h2>
        <button
          type="button"
          className="text-action"
          onClick={() => {
            track('contact_cta_click', { cta_location: 'studio_page' });
            onContact();
          }}
        >
          Contact us
          <ArrowRightIcon />
        </button>
      </aside>
    </main>
  );
}
