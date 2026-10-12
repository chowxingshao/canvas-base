export type ContactValues = {
  name: string;
  email: string;
  message: string;
  website: string;
};
type ContactErrors = Partial<
  Record<'name' | 'email' | 'message', 'required' | 'invalid'>
>;

// Match the native single-address email input rules; providers validate again.
const emailPattern =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

export function validateContact(values: ContactValues): {
  valid: boolean;
  errors: ContactErrors;
  spam: boolean;
} {
  const errors: ContactErrors = {};
  for (const name of ['name', 'email', 'message'] as const) {
    const value = values[name].trim();
    if (!value) errors[name] = 'required';
    else if (name === 'email' && !emailPattern.test(value))
      errors.email = 'invalid';
  }
  const spam = Boolean(values.website.trim());
  return { valid: !spam && Object.keys(errors).length === 0, errors, spam };
}
