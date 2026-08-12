const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function formatBrazilianPhone(value) {
  let digits = value.replace(/\D/g, '');

  if (digits.startsWith('55') && digits.length === 13) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function validateLead(values) {
  const errors = {};
  const name = values.name.trim().replace(/\s+/g, ' ');
  const phoneDigits = values.phone.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');

  if (name.length < 2) {
    errors.name = 'Digite seu nome.';
  }

  if (phoneDigits.length !== 11) {
    errors.phone = 'Digite um WhatsApp com DDD e 11 dígitos.';
  }

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Digite um e-mail válido.';
  }

  if (!values.consent) {
    errors.consent = 'Confirme que aceita receber as comunicações.';
  }

  return errors;
}
