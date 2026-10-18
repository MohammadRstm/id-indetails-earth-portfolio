export interface ContactMessage {
  name: string;
  email: string;
  /** Optional. */
  phone: string;
  message: string;
  /** Honeypot: a field hidden from people, so only bots fill it in. The API quietly drops those messages. */
  website: string;
}

export type ContactField = Exclude<keyof ContactMessage, 'website'>;
export type ContactErrors = Partial<Record<ContactField, string>>;

export const MESSAGE_MIN_LENGTH = 10;
export const MESSAGE_MAX_LENGTH = 4000;
const NAME_MAX_LENGTH = 120;

/** Deliberately simple: something@something.something, no spaces. The server should check again. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Digits with the usual separators and an optional leading +, at least 6 digits. */
const PHONE_PATTERN = /^\+?[\d\s().-]{6,}$/;

export const emptyContactMessage: ContactMessage = { name: '', email: '', phone: '', message: '', website: '' };

/** Checks the form before sending; returns a message for each field that needs fixing. */
export function validateContactMessage(values: ContactMessage): ContactErrors {
  const errors: ContactErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const message = values.message.trim();

  if (!name) errors.name = 'Enter your name.';
  else if (name.length > NAME_MAX_LENGTH) errors.name = `Keep your name under ${NAME_MAX_LENGTH} characters.`;

  if (!email) errors.email = 'Enter your email address.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter an email address like name@example.com.';

  if (phone && (!PHONE_PATTERN.test(phone) || phone.replace(/\D/g, '').length < 6)) {
    errors.phone = 'Enter a phone number using digits, spaces and an optional +.';
  }

  if (!message) errors.message = 'Tell us a little about your project.';
  else if (message.length < MESSAGE_MIN_LENGTH) errors.message = `Write at least ${MESSAGE_MIN_LENGTH} characters.`;
  else if (message.length > MESSAGE_MAX_LENGTH) errors.message = `Keep your message under ${MESSAGE_MAX_LENGTH} characters.`;

  return errors;
}

/** The message as it should be sent: surrounding spaces removed. */
export function cleanContactMessage(values: ContactMessage): ContactMessage {
  return {
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    message: values.message.trim(),
    website: values.website,
  };
}
