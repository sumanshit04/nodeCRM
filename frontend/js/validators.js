const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,79}$/;
const PHONE_RE = /^\+?[0-9]{7,15}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ZIP_PATTERNS = {
  US: /^\d{5}(-\d{4})?$/,
  IN: /^\d{6}$/,
  GB: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
  CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
  AU: /^\d{4}$/,
  DE: /^\d{5}$/,
  IT: /^\d{5}$/,
  FR: /^\d{5}$/,
};

function required(value, message) {
  if (!String(value || '').trim()) return message;
  return '';
}

function validateName(value) {
  const v = String(value || '').trim();
  if (!v) return 'Name is required.';
  if (v.length < 2 || v.length > 80) return 'Name must be between 2 and 80 characters.';
  if (!NAME_RE.test(v)) return 'Name contains invalid characters.';
  return '';
}

function validateEmail(value) {
  const v = String(value || '').trim();
  if (!v) return 'Email is required.';
  if (!EMAIL_RE.test(v)) return 'Please enter a valid email address.';
  return '';
}

function validatePhone(value) {
  const v = String(value || '').replace(/[\s()-]/g, '');
  if (!v) return 'Phone number is required.';
  if (!PHONE_RE.test(v)) return 'Please enter a valid phone number.';
  return '';
}

function validatePassword(value) {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must contain at least 8 characters.';
  if (!PASSWORD_RE.test(value)) {
    return 'Password must include uppercase, lowercase, number, and special character.';
  }
  return '';
}

function validatePin(country, pin) {
  const v = String(pin || '').trim();
  if (!v) return 'PIN / ZIP code is required.';
  const pattern = ZIP_PATTERNS[String(country || '').toUpperCase()];
  if (pattern && !pattern.test(v)) return 'Please enter a valid PIN / ZIP code for the selected country.';
  if (!pattern && (v.length < 3 || v.length > 12)) return 'Please enter a valid PIN / ZIP code.';
  return '';
}

function applyErrors(form, errors) {
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  Object.entries(errors || {}).forEach(([name, message]) => {
    const field = form.elements[name];
    if (!field) return;
    field.classList.add('is-invalid');
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) feedback.textContent = message;
  });
}

window.CRMValidators = {
  required,
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validatePin,
  applyErrors,
};
