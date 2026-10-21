import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { ApiError } from '../api/errors';
import { postContactMessage } from '../api/website';
import {
  cleanContactMessage,
  emptyContactMessage,
  MESSAGE_MAX_LENGTH,
  validateContactMessage,
  type ContactErrors,
  type ContactField,
  type ContactMessage,
} from '../lib/contactForm';

/** Why a message didn't go: no contact email set yet, the hourly limit, or anything else. */
type FailReason = 'unavailable' | 'too-many' | 'other';
type SendState = { status: 'idle' } | { status: 'sending' } | { status: 'sent' } | { status: 'failed'; reason: FailReason };

const FIELD_NAMES: ContactField[] = ['name', 'email', 'phone', 'message'];

function failReason(error: unknown): FailReason {
  if (error instanceof ApiError && error.code === 'website_contact_unavailable') return 'unavailable';
  if (error instanceof ApiError && error.status === 429) return 'too-many';
  return 'other';
}

const FIELDS: { name: ContactField; label: string; type: string; autoComplete: string; optional?: boolean }[] = [
  { name: 'name', label: 'Name', type: 'text', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', optional: true },
];

interface ContactFormProps {
  /** The company's contact email, offered when a message can't be sent; null until it is set. */
  email: string | null;
  /** Whether the page lists studio phone numbers to call instead. */
  hasPhones: boolean;
}

/**
 * The enquiry form: checks its fields, sends them to the website API, which
 * emails the company, and reports the outcome in a live region. The server's
 * own field checks show beside the fields like the form's.
 */
export function ContactForm({ email, hasPhones }: ContactFormProps) {
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
      await postContactMessage(cleanContactMessage(values));
      setSend({ status: 'sent' });
      setValues(emptyContactMessage);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.isValidation) {
        const fromServer: ContactErrors = {};
        for (const field of FIELD_NAMES) {
          const message = error.fieldErrors[field]?.[0];
          if (message) fromServer[field] = message;
        }
        setErrors(fromServer);
        setSend({ status: 'idle' });
        const first = FIELD_NAMES.find((field) => fromServer[field]);
        if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
        return;
      }
      const reason = failReason(error);
      if (reason === 'other') console.error('Contact message failed to send', error);
      setSend({ status: 'failed', reason });
    }
  };

  // Another way to reach the studio, when the form can't send.
  const instead: ReactNode = email ? (
    <>
      {' '}
      You can also email us at <a href={`mailto:${email}`}>{email}</a>.
    </>
  ) : hasPhones ? (
    ' You can also call one of our studios.'
  ) : null;
  const failure: Record<FailReason, string> = {
    unavailable: 'Sending messages online isn’t switched on yet.',
    'too-many': 'Several messages were sent from here in a short time. Please try again in an hour.',
    other: 'Your message could not be sent. Please try again.',
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
          {send.status === 'failed' && (
            <>
              {failure[send.reason]}
              {instead}
            </>
          )}
        </p>
      </div>
    </form>
  );
}
