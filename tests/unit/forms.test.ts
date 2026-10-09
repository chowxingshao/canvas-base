import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { validateContact } from '../../src/lib/forms/validation.ts';
import {
  initContactForm,
  installContactFormLifecycle,
} from '../../src/scripts/contact-form.ts';
import { buildFixture } from '../helpers/build.ts';

import { JSDOM } from 'jsdom';

let dom: JSDOM;
beforeEach(() => {
  dom = new JSDOM('', { url: 'https://local.example.test/' });
  for (const name of [
    'document',
    'Event',
    'XMLHttpRequest',
    'Storage',
  ] as const)
    vi.stubGlobal(name, dom.window[name]);
});
const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  document.body.innerHTML = '';
  dom.window.close();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function formFixture() {
  document.body.innerHTML = `<form data-contact-form method="post" action="https://forms.example.test/contact" data-invalid-message="Review the fields." data-spam-message="Unable to submit.">
    <fieldset><legend>Contact</legend>
    <label for="name">Name</label><input id="name" name="name" required aria-describedby="name-error" data-required-message="Name required."><p id="name-error" data-error-for="name" aria-live="polite"></p>
    <label for="email">Email</label><input id="email" name="email" type="email" required aria-describedby="email-error" data-required-message="Email required." data-invalid-message="Valid email required."><p id="email-error" data-error-for="email" aria-live="polite"></p>
    <label for="message">Message</label><textarea id="message" name="message" required aria-describedby="message-error" data-required-message="Message required."></textarea><p id="message-error" data-error-for="message" aria-live="polite"></p>
    <input name="website" tabindex="-1" aria-hidden="true"><button type="submit">Send</button></fieldset><p data-contact-status role="status"></p></form>`;
  return document.querySelector('form')!;
}
function field(form: HTMLFormElement, name: string) {
  return form.elements.namedItem(name) as HTMLInputElement;
}
function validFields(form: HTMLFormElement) {
  field(form, 'name').value = ' Ada ';
  field(form, 'email').value = 'ada@example.com';
  field(form, 'message').value = ' Hello ';
}
function submit(form: HTMLFormElement) {
  // Dispatch only: the event's default is intercepted; no real submission occurs.
  const event = new Event('submit', { cancelable: true, bubbles: true });
  form.dispatchEvent(event);
  return event;
}

describe('contact validation', () => {
  it('rejects whitespace-only required values and malformed email', () => {
    expect(
      validateContact({ name: ' ', email: 'bad', message: '', website: '' }),
    ).toEqual({
      valid: false,
      errors: { name: 'required', email: 'invalid', message: 'required' },
      spam: false,
    });
  });
  it.each(['', ' ', 'a b@example.com', 'a@', '@example.com', 'a@example..com'])(
    'rejects invalid email %j',
    (email) => {
      expect(
        validateContact({ name: 'Ada', email, message: 'Hello', website: '' }),
      ).toMatchObject({
        valid: false,
        errors: { email: email.trim() ? 'invalid' : 'required' },
      });
    },
  );
  it('accepts trimmed valid fields without mutating the caller', () => {
    const values = {
      name: ' Ada ',
      email: ' ada@example.com ',
      message: ' Hello ',
      website: ' ',
    };
    expect(validateContact(values)).toEqual({
      valid: true,
      errors: {},
      spam: false,
    });
    expect(values.name).toBe(' Ada ');
  });
  it('blocks a filled honeypot even with otherwise valid values', () => {
    expect(
      validateContact({
        name: 'Ada',
        email: 'ada@example.com',
        message: 'Hello',
        website: ' spam ',
      }),
    ).toEqual({ valid: false, errors: {}, spam: true });
  });
});

describe('contact enhancement', () => {
  it('prevents invalid submission, announces linked errors, and focuses the first invalid field', () => {
    const form = formFixture();
    cleanups.push(initContactForm(form));
    field(form, 'email').value = 'bad';
    expect(submit(form).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(field(form, 'name'));
    for (const name of ['name', 'email', 'message']) {
      const input = field(form, name);
      expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(
        document.getElementById(input.getAttribute('aria-describedby')!)
          ?.textContent,
      ).not.toBe('');
    }
    expect(form.querySelector('[data-contact-status]')?.textContent).toBe(
      'Review the fields.',
    );
  });
  it('clears corrected errors and preserves native POST with trimmed values', () => {
    const form = formFixture();
    cleanups.push(initContactForm(form));
    submit(form);
    validFields(form);
    field(form, 'name').dispatchEvent(new Event('input', { bubbles: true }));
    expect(field(form, 'name').hasAttribute('aria-invalid')).toBe(false);
    expect(document.getElementById('name-error')?.textContent).toBe('');
    expect(submit(form).defaultPrevented).toBe(false);
    expect(field(form, 'name').value).toBe('Ada');
    expect(field(form, 'message').value).toBe('Hello');
    expect(form.method).toBe('post');
    expect(form.querySelector('[data-contact-status]')?.textContent).toBe('');
  });
  it('blocks spam locally without network, browser storage, or value logging', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, 'open');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    const logSpy = vi.spyOn(console, 'log');
    const warnSpy = vi.spyOn(console, 'warn');
    const errorSpy = vi.spyOn(console, 'error');
    const form = formFixture();
    cleanups.push(initContactForm(form));
    submit(form);
    validFields(form);
    expect(submit(form).defaultPrevented).toBe(false);
    field(form, 'website').value = 'bot';
    expect(submit(form).defaultPrevented).toBe(true);
    expect(form.querySelector('[data-contact-status]')?.textContent).toBe(
      'Unable to submit.',
    );
    for (const spy of [fetchSpy, xhrSpy, storageSpy, logSpy, warnSpy, errorSpy])
      expect(spy).not.toHaveBeenCalled();
  });
  it('restores native validation and removes listeners after repeated cleanup', () => {
    const form = formFixture();
    const cleanup = initContactForm(form);
    expect(form.noValidate).toBe(true);
    cleanup();
    cleanup();
    expect(form.noValidate).toBe(false);
    expect(submit(form).defaultPrevented).toBe(false);
    expect(field(form, 'name').hasAttribute('aria-invalid')).toBe(false);
    field(form, 'name').setAttribute('aria-invalid', 'true');
    validFields(form);
    field(form, 'name').dispatchEvent(new Event('input', { bubbles: true }));
    expect(field(form, 'name').getAttribute('aria-invalid')).toBe('true');
  });
  it('prevents forced submissions of an unconfigured form without enabling fields', () => {
    const form = formFixture();
    form.removeAttribute('action');
    form.querySelector('fieldset')!.disabled = true;
    cleanups.push(initContactForm(form));
    expect(submit(form).defaultPrevented).toBe(true);
    expect(form.noValidate).toBe(false);
    expect(form.querySelector('fieldset')!.disabled).toBe(true);
  });
  it('initializes the first page, disposes before swaps, and replaces listeners on repeated page loads', () => {
    const oldForm = formFixture();
    const dispose = installContactFormLifecycle(document);
    cleanups.push(dispose);
    expect(submit(oldForm).defaultPrevented).toBe(true);
    const focus = vi.spyOn(field(oldForm, 'name'), 'focus');
    document.dispatchEvent(new Event('astro:page-load'));
    document.dispatchEvent(new Event('astro:page-load'));
    expect(submit(oldForm).defaultPrevented).toBe(true);
    expect(focus).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new Event('astro:before-swap'));
    expect(oldForm.noValidate).toBe(false);
    expect(submit(oldForm).defaultPrevented).toBe(false);
    const nextForm = formFixture();
    document.dispatchEvent(new Event('astro:page-load'));
    expect(submit(nextForm).defaultPrevented).toBe(true);
    dispose();
    dispose();
    document.dispatchEvent(new Event('astro:page-load'));
    expect(submit(nextForm).defaultPrevented).toBe(false);
  });
});

describe('built contact form', () => {
  it.each(['', 'https://forms.example.test/contact'])(
    'renders the endpoint state %j with usable native HTML',
    async (endpoint) => {
      const fixture = await buildFixture({
        config: { formEndpoint: endpoint },
      });
      try {
        expect(fixture.exitCode, fixture.stdout + fixture.stderr).toBe(0);
        document.body.innerHTML = await readFile(
          join(fixture.outputDir, 'contact/index.html'),
          'utf8',
        );
        const form = document.querySelector<HTMLFormElement>(
          '[data-contact-form]',
        )!;
        expect(form).not.toBeNull();
        expect(form.method).toBe('post');
        expect(form.noValidate).toBe(false);
        expect(form.getAttribute('action')).toBe(endpoint || null);
        expect(form.querySelector('fieldset')!.disabled).toBe(!endpoint);
        expect(form.querySelector('button')!.disabled).toBe(!endpoint);
        expect(
          form.textContent?.includes('Contact form is not configured yet.'),
        ).toBe(!endpoint);
        for (const name of ['name', 'email', 'message']) {
          const input = field(form, name);
          expect(input.required).toBe(true);
          expect(form.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
          expect(
            document
              .getElementById(input.getAttribute('aria-describedby')!)
              ?.getAttribute('aria-live'),
          ).toBe('polite');
        }
        const trap = field(form, 'website');
        expect(trap.tabIndex).toBe(-1);
        expect(trap.getAttribute('aria-hidden')).toBe('true');
        if (endpoint) {
          expect(form.checkValidity()).toBe(false);
          validFields(form);
          expect(form.checkValidity()).toBe(true);
        }
      } finally {
        await fixture.dispose();
      }
    },
    120_000,
  );
});
