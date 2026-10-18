import { describe, expect, it } from 'vitest';
import { cleanContactMessage, emptyContactMessage, MESSAGE_MAX_LENGTH, validateContactMessage } from './contactForm';

const valid = { name: 'Rana Haddad', email: 'rana@example.com', phone: '', message: 'A villa near Batroun, starting next spring.', website: '' };

describe('validateContactMessage', () => {
  it('accepts a complete message, with or without a phone number', () => {
    expect(validateContactMessage(valid)).toEqual({});
    expect(validateContactMessage({ ...valid, phone: '+961 3 123 456' })).toEqual({});
    expect(validateContactMessage({ ...valid, phone: '(01) 234-5678' })).toEqual({});
  });

  it('asks for every required field on an empty form, but not the phone', () => {
    const errors = validateContactMessage(emptyContactMessage);
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name']);
  });

  it('treats spaces alone as empty', () => {
    expect(validateContactMessage({ ...valid, name: '   ' }).name).toBeDefined();
    expect(validateContactMessage({ ...valid, message: '      ' }).message).toBeDefined();
  });

  it('rejects malformed email addresses', () => {
    for (const email of ['rana', 'rana@', '@example.com', 'rana@example', 'ra na@example.com']) {
      expect(validateContactMessage({ ...valid, email }).email, email).toBeDefined();
    }
  });

  it('rejects phone numbers that are not numbers', () => {
    for (const phone of ['abc', '12', '+961 abc 123', '++--  ']) {
      expect(validateContactMessage({ ...valid, phone }).phone, phone).toBeDefined();
    }
  });

  it('asks for a message of a sensible length', () => {
    expect(validateContactMessage({ ...valid, message: 'Hi' }).message).toBeDefined();
    expect(validateContactMessage({ ...valid, message: 'x'.repeat(MESSAGE_MAX_LENGTH + 1) }).message).toBeDefined();
  });
});

describe('cleanContactMessage', () => {
  it('trims every field', () => {
    expect(
      cleanContactMessage({ name: ' Rana ', email: ' rana@example.com ', phone: ' 1 ', message: ' Hello there ', website: '' }),
    ).toEqual({
      name: 'Rana',
      email: 'rana@example.com',
      phone: '1',
      message: 'Hello there',
      website: '',
    });
  });
});
