import { track } from '../analytics/analytics';
import type { Office } from '../data/offices';
import type { Service } from '../data/site';
import { ArrowRightIcon } from './icons';

const pad = (value: number) => String(value).padStart(2, '0');

/** "Beirut", "Beirut and Abidjan", "Beirut, Dubai and Abidjan". */
const citiesList = (offices: Office[]) => {
  const cities = offices.map((office) => office.city);
  return cities.length > 1 ? `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}` : cities[0];
};

interface StudioPageProps {
  services: Service[];
  offices: Office[];
  onContact: () => void;
}

/** The studio and what it does. Services and studios not entered yet are left out. */
export function StudioPage({ services, offices, onContact }: StudioPageProps) {
  return (
    <main className="page" id="content">
      <header className="page__intro">
        <p className="eyebrow page__eyebrow">Studio</p>
        <h1 className="page__title">An architecture studio designing homes, hotels and residences around the world.</h1>
        <p className="page__lead">
          We work from the first sketch to the last detail: architecture, interiors and landscape, shaped by each site’s climate,
          light and craft.{offices.length > 0 && ` Our studios are in ${citiesList(offices)}.`}
        </p>
      </header>

      {services.length > 0 && (
        <section className="page__section" aria-labelledby="services-title">
          <h2 className="section-title" id="services-title">
            What we do
          </h2>
          <ol className="services">
            {services.map((service, index) => (
              <li key={service.id} className="service">
                <span className="service__number" aria-hidden="true">
                  {pad(index + 1)}
                </span>
                <h3 className="service__title">{service.title}</h3>
                <p className="service__text">{service.description}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

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
