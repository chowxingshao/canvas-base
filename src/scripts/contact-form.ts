import {
  validateContact,
  type ContactValues,
} from '../lib/forms/validation.ts';

const visibleFields = ['name', 'email', 'message'] as const;
type FieldName = (typeof visibleFields)[number];
type Field = HTMLInputElement | HTMLTextAreaElement;

export function initContactForm(form: HTMLFormElement): () => void {
  const configured =
    Boolean(form.getAttribute('action')?.trim()) &&
    !form.querySelector('fieldset')?.disabled;
  const previousNoValidate = form.noValidate;
  const fields = Object.fromEntries(
    [...visibleFields, 'website'].map((name) => [
      name,
      form.elements.namedItem(name) as Field,
    ]),
  ) as Record<keyof ContactValues, Field>;
  const status = form.querySelector<HTMLElement>('[data-contact-status]');
  function values(): ContactValues {
    return {
      name: fields.name.value,
      email: fields.email.value,
      message: fields.message.value,
      website: fields.website.value,
    };
  }
  function showError(name: FieldName, code?: 'required' | 'invalid') {
    const field = fields[name];
    const error = form.querySelector<HTMLElement>(`[data-error-for="${name}"]`);
    if (code) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    if (error)
      error.textContent = code
        ? (field.dataset[
            code === 'required' ? 'requiredMessage' : 'invalidMessage'
          ] ?? '')
        : '';
  }
  function onSubmit(event: Event) {
    if (!configured) {
      event.preventDefault();
      return;
    }
    const result = validateContact(values());
    for (const name of visibleFields) showError(name, result.errors[name]);
    if (status)
      status.textContent = result.valid
        ? ''
        : (form.dataset[result.spam ? 'spamMessage' : 'invalidMessage'] ?? '');
    if (!result.valid) {
      event.preventDefault();
      const firstInvalid = visibleFields.find((name) => result.errors[name]);
      if (firstInvalid) fields[firstInvalid].focus();
      return;
    }
    for (const field of Object.values(fields)) field.value = field.value.trim();
    // Let the browser submit its native POST. No values leave through this script.
  }
  function onInput(event: Event) {
    const name = visibleFields.find((name) => fields[name] === event.target);
    if (configured && name && fields[name].hasAttribute('aria-invalid')) {
      const result = validateContact(values());
      showError(name, result.errors[name]);
      if (result.valid && status) status.textContent = '';
    }
  }
  form.addEventListener('submit', onSubmit);
  form.addEventListener('input', onInput);
  if (configured) form.noValidate = true;
  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    form.removeEventListener('submit', onSubmit);
    form.removeEventListener('input', onInput);
    form.noValidate = previousNoValidate;
  };
}

export function installContactFormLifecycle(root: Document): () => void {
  let cleanups: (() => void)[] = [];
  function disposeForms() {
    cleanups.splice(0).forEach((cleanup) => cleanup());
  }
  function initialize() {
    disposeForms();
    cleanups = Array.from(
      root.querySelectorAll<HTMLFormElement>('form[data-contact-form]'),
      initContactForm,
    );
  }
  root.addEventListener('astro:page-load', initialize);
  root.addEventListener('astro:before-swap', disposeForms);
  initialize();
  return () => {
    disposeForms();
    root.removeEventListener('astro:page-load', initialize);
    root.removeEventListener('astro:before-swap', disposeForms);
  };
}
