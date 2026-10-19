import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ContactNotConnectedError, sendContactMessage } from '../data/contactSource';
import { contactInfo } from '../data/site';
import {
  cleanContactMessage,
  emptyContactMessage,
  MESSAGE_MAX_LENGTH,
  validateContactMessage,
  type ContactErrors,
  type ContactField,
  type ContactMessage,
} from '../lib/contactForm';

type SendState = { status: 'idle' } | { status: 'sending' } | { status: 'sent' } | { status: 'failed'; notConnected: boolean };

const FIELDS: { name: ContactField; label: string; type: string; autoComplete: string; optional?: boolean }[] = [
  { name: 'name', label: 'Name', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', optional: true },
];

/** The enquiry form: checks its fields before sending and reports the outcome in a live region. */
export function ContactForm() {
  const [values, setValues] = useState<ContactMessage>(emptyContactMessage);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [send, setSend] = useState<SendState>({ status: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);

  const update = (field: ContactField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    // A corrected field stops showing its error as soon as it is valid.
    if (errors[field]) setErrors((current) => ({ ...current, [field]: validateContactMessage({ ...values, [field]: value })[field] }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateContactMessage(values);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as ContactField[])[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    setSend({ status: 'sending' });
    try {
      await sendContactMessage(cleanContactMessage(values));
      setSend({ status: 'sent' });
      setValues(emptyContactMessage);
    } catch (error: unknown) {
      if (!(error instanceof ContactNotConnectedError)) console.error('Contact message failed to send', error);
      setSend({ status: 'failed', notConnected: error instanceof ContactNotConnectedError });
    }
  };

  const describedBy = (field: ContactField) => (errors[field] ? `contact-${field}-error` : undefined);

  return (
    <form ref={formRef} className="contact-form" noValidate onSubmit={handleSubmit} aria-labelledby="contact-form-title">
      <h2 className="section-title" id="contact-form-title">
        Send us a message
      </h2>

      {FIELDS.map((field) => (
        <div key={field.name} className="field" data-invalid={Boolean(errors[field.name])}>
          <label className="field__label" htmlFor={`contact-${field.name}`}>
            {field.label}
            {field.optional && <span className="field__optional"> (optional)</span>}
          </label>
          <input
            id={`contact-${field.name}`}
            className="field__input"
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            value={values[field.name]}
            onChange={update(field.name)}
            required={!field.optional}
            aria-invalid={Boolean(errors[field.name])}
            aria-describedby={describedBy(field.name)}
          />
          {errors[field.name] && (
            <p className="field__error" id={`contact-${field.name}-error`}>
              {errors[field.name]}
            </p>
          )}
        </div>
      ))}

      <div className="field" data-invalid={Boolean(errors.message)}>
        <label className="field__label" htmlFor="contact-message">
          Your project
        </label>
        <textarea
          id="contact-message"
          className="field__input field__input--area"
          name="message"
          rows={6}
          maxLength={MESSAGE_MAX_LENGTH}
          value={values.message}
          onChange={update('message')}
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={describedBy('message')}
        />
        {errors.message && (
          <p className="field__error" id="contact-message-error">
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and from assistive technology; only bots fill it in. */}
      <div className="contact-form__trap" aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => setValues((current) => ({ ...current, website: event.target.value }))}
        />
      </div>

      <div className="contact-form__footer">
        <button type="submit" className="button" disabled={send.status === 'sending'}>
          {send.status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        <p className="contact-form__status" role="status" data-tone={send.status === 'failed' ? 'error' : undefined}>
          {send.status === 'sent' && 'Thank you. Your message has been sent and we will reply soon.'}
          {send.status === 'failed' &&
            (send.notConnected ? (
              contactInfo.email ? (
                <>
                  Online sending is not switched on yet. Please email us at{' '}
                  <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>.
                </>
              ) : (
                'Online sending is not switched on yet. Please call one of our studios below.'
              )
            ) : contactInfo.email ? (
              <>
                Your message could not be sent. Please try again, or email us at{' '}
                <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>.
              </>
            ) : (
              'Your message could not be sent. Please try again later, or call one of our studios below.'
            ))}
        </p>
      </div>
    </form>
  );
}
