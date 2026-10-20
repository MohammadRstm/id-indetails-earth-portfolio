import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { sendContactMessage } from '../data/contactSource';
import { contactInfo } from '../data/site';
import {
  cleanContactMessage,
  contactFailure,
  emptyContactMessage,
  MESSAGE_MAX_LENGTH,
  validateContactMessage,
  type ContactErrors,
  type ContactField,
  type ContactMessage,
} from '../lib/contactForm';

type SendState = { status: 'idle' } | { status: 'sending' } | { status: 'sent' } | { status: 'failed'; reason: 'busy' | 'unavailable' | 'failed' };

const FAILED: Record<'busy' | 'unavailable' | 'failed', { lead: string; withoutEmail: string }> = {
  busy: {
    lead: 'You have sent several messages in the last hour. Please try again later, or email us at',
    withoutEmail: 'You have sent several messages in the last hour. Please try again later, or call one of our studios below.',
  },
  unavailable: {
    lead: 'Online sending is not available right now. Please email us at',
    withoutEmail: 'Online sending is not available right now. Please call one of our studios below.',
  },
  failed: {
    lead: 'Your message could not be sent. Please try again, or email us at',
    withoutEmail: 'Your message could not be sent. Please try again later, or call one of our studios below.',
  },
};

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

  const showErrors = (found: ContactErrors): boolean => {
    setErrors(found);
    const firstInvalid = (Object.keys(found) as ContactField[])[0];
    if (firstInvalid) formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
    return Boolean(firstInvalid);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (showErrors(validateContactMessage(values))) return;
    setSend({ status: 'sending' });
    try {
      await sendContactMessage(cleanContactMessage(values));
      setSend({ status: 'sent' });
      setValues(emptyContactMessage);
    } catch (error: unknown) {
      const failure = contactFailure(error);
      if (failure.kind === 'fields') {
        setSend({ status: 'idle' });
        showErrors(failure.errors);
        return;
      }
      if (failure.kind === 'failed') console.error('Contact message failed to send', error);
      setSend({ status: 'failed', reason: failure.kind });
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
            (contactInfo.email ? (
              <>
                {FAILED[send.reason].lead} <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>.
              </>
            ) : (
              FAILED[send.reason].withoutEmail
            ))}
        </p>
      </div>
    </form>
  );
}
