import { track } from '../analytics/analytics';
import type { Office } from '../data/offices';
import type { ContactInfo } from '../data/site';
import { ContactForm } from './ContactForm';

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** Google's keyless embed of a pin at the office's exact position. */
const mapEmbedUrl = ({ lat, lng }: Office) => `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
const mapLinkUrl = ({ lat, lng }: Office) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

interface ContactPageProps {
  offices: Office[];
  contact: ContactInfo;
}

/**
 * How to reach the studio: the enquiry form, email, phone numbers and each
 * studio on a map. Details not entered in the dashboard yet are left out.
 */
export function ContactPage({ offices, contact }: ContactPageProps) {
  const withPhone = offices.filter((office) => office.phone);

  return (
    <main className="page" id="content">
      <header className="page__intro">
        <p className="eyebrow page__eyebrow">Contact</p>
        <h1 className="page__title">Let’s talk about your project.</h1>
        <p className="page__lead">Tell us what you are planning, where, and when.</p>
      </header>

      <div className="contact">
        <ContactForm email={contact.email} hasPhones={withPhone.length > 0} />

        {(contact.email || withPhone.length > 0) && (
          <aside className="contact__details" aria-label="Contact details">
            {contact.email && (
              <div className="contact__item">
                <h2 className="contact__label">Email</h2>
                <a
                  className="contact__value"
                  href={`mailto:${contact.email}`}
                  onClick={() => track('email_click', { link_location: 'contact_page' })}
                >
                  {contact.email}
                </a>
              </div>
            )}
            {withPhone.length > 0 && (
              <div className="contact__item">
                <h2 className="contact__label">Phone</h2>
                <ul>
                  {withPhone.map((office) => (
                    <li key={office.id}>
                      <span className="contact__city">{office.city}</span>
                      <a
                        className="contact__value"
                        href={telHref(office.phone)}
                        onClick={() => track('phone_click', { link_location: 'contact_details', office_city: office.city })}
                      >
                        {office.phone}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}
      </div>

      {offices.length > 0 && (
        <section className="page__section" aria-labelledby="studios-title">
          <h2 className="section-title" id="studios-title">
            Our studios
          </h2>
          <div className="offices">
            {offices.map((office) => (
              <article key={office.id} className="office" aria-labelledby={`office-${office.id}`}>
                <iframe
                  className="office__map"
                  src={mapEmbedUrl(office)}
                  title={`Map of the ID-Indetails studio in ${office.city}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="office__body">
                  <h3 className="office__city" id={`office-${office.id}`}>
                    {office.city}, {office.country}
                  </h3>
                  {office.address && <p className="office__address">{office.address}</p>}
                  {office.phone && (
                    <a
                      className="office__phone"
                      href={telHref(office.phone)}
                      onClick={() => track('phone_click', { link_location: 'office', office_city: office.city })}
                    >
                      {office.phone}
                    </a>
                  )}
                  <a className="office__directions" href={mapLinkUrl(office)} target="_blank" rel="noopener noreferrer">
                    Open in Google Maps
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
