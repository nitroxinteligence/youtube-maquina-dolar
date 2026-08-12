import { useEffect, useRef, useState } from 'react';
import { formatBrazilianPhone, validateLead } from '../lib/validation';
import { LeadLoversSubmissionError, submitLeadToLeadLovers } from '../lib/leadLovers';
import { GlowButton } from './GlowButton';

const initialValues = {
  name: '',
  phone: '',
  email: '',
  consent: false,
};

export function CaptureDialog({ open, onClose }) {
  const dialogRef = useRef(null);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const documentRoot = document.documentElement;
    if (!dialog) return;

    if (open) {
      documentRoot.classList.add('modal-open');
      if (!dialog.open) dialog.showModal();
    } else {
      documentRoot.classList.remove('modal-open');
      if (dialog.open) dialog.close();
    }

    return () => documentRoot.classList.remove('modal-open');
  }, [open]);

  function handleClose() {
    setErrors({});
    setSubmitError('');
    onClose();
  }

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateLead(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstInvalidField = ['name', 'phone', 'email', 'consent'].find((field) => nextErrors[field]);
      document.getElementById(`lead-${firstInvalidField}`)?.focus();
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await submitLeadToLeadLovers(values);
      window.location.assign('/ob/');
    } catch (error) {
      const message = error instanceof LeadLoversSubmissionError
        ? error.message
        : 'Não foi possível concluir agora. Verifique sua conexão e tente novamente.';
      setSubmitError(message);
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="capture-dialog"
      aria-describedby="capture-instructions"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      onClose={() => {
        if (open) handleClose();
      }}
    >
      <div className="capture-dialog__content">
        <button className="capture-dialog__close" type="button" onClick={handleClose} aria-label="Fechar formulário">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>

        <p className="capture-dialog__intro" id="capture-instructions">
          Preencha seus dados para receber o conteúdo da Aula Magna.
        </p>

        <form className="capture-form" noValidate onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="lead-name">Nome</label>
            <input
              id="lead-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Como podemos chamar você?"
              value={values.name}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'lead-name-error' : undefined}
              onChange={(event) => updateValue('name', event.target.value)}
            />
            {errors.name && <span className="form-field__error" id="lead-name-error">{errors.name}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="lead-phone">WhatsApp</label>
            <input
              id="lead-phone"
              name="phone"
              type="tel"
              autoComplete="tel-national"
              inputMode="numeric"
              placeholder="+55 (11) 99999-9999"
              value={values.phone}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'lead-phone-error' : undefined}
              onChange={(event) => updateValue('phone', formatBrazilianPhone(event.target.value))}
            />
            {errors.phone && <span className="form-field__error" id="lead-phone-error">{errors.phone}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="lead-email">E-mail</label>
            <input
              id="lead-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="voce@exemplo.com"
              value={values.email}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'lead-email-error' : undefined}
              onChange={(event) => updateValue('email', event.target.value)}
            />
            {errors.email && <span className="form-field__error" id="lead-email-error">{errors.email}</span>}
          </div>

          <div className="consent-field">
            <input
              id="lead-consent"
              name="consent"
              type="checkbox"
              checked={values.consent}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? 'lead-consent-error' : 'lead-consent-help'}
              onChange={(event) => updateValue('consent', event.target.checked)}
            />
            <label htmlFor="lead-consent" id="lead-consent-help">
              Aceito receber comunicações sobre a Aula Magna e concordo com a <a href="/privacidade/" target="_blank" rel="noreferrer">Política de Privacidade</a>.
            </label>
          </div>
          {errors.consent && <span className="form-field__error consent-field__error" id="lead-consent-error">{errors.consent}</span>}

          {submitError && <p className="capture-form__submit-error" role="alert">{submitError}</p>}

          <div className="capture-form__submit">
            <GlowButton type="submit" fullWidth disabled={submitting}>
              {submitting ? 'ENVIANDO...' : 'QUERO GANHAR EM DÓLAR'}
            </GlowButton>
          </div>
        </form>
      </div>
    </dialog>
  );
}
