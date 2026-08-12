export class LeadLoversConfigurationError extends Error {}

const formAction = import.meta.env.VITE_LEADLOVERS_FORM_ACTION?.trim();
const previewEnabled = import.meta.env.DEV || import.meta.env.VITE_LEADLOVERS_PREVIEW === 'true';

function parseHiddenFields() {
  const rawValue = import.meta.env.VITE_LEADLOVERS_HIDDEN_FIELDS;
  if (!rawValue) return {};

  try {
    return JSON.parse(rawValue);
  } catch {
    throw new LeadLoversConfigurationError('Os campos ocultos do LeadLovers não contêm um JSON válido.');
  }
}

function createFormField(name, value) {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = String(value);
  return input;
}

function postWithNativeForm(payload) {
  const sinkName = 'leadlovers-submit-sink';
  let sink = document.querySelector(`iframe[name="${sinkName}"]`);

  if (!sink) {
    sink = document.createElement('iframe');
    sink.name = sinkName;
    sink.hidden = true;
    sink.setAttribute('aria-hidden', 'true');
    document.body.append(sink);
  }

  const form = document.createElement('form');
  form.action = formAction;
  form.method = 'POST';
  form.target = sinkName;
  form.hidden = true;

  Object.entries(payload).forEach(([name, value]) => {
    form.append(createFormField(name, value));
  });

  document.body.append(form);
  form.submit();
  form.remove();
}

export async function submitLeadToLeadLovers(lead) {
  if (!formAction) {
    if (!previewEnabled) {
      throw new LeadLoversConfigurationError('O formulário ainda não foi conectado ao LeadLovers.');
    }

    await new Promise((resolve) => window.setTimeout(resolve, 450));
    return { mode: 'preview' };
  }

  const payload = {
    ...parseHiddenFields(),
    [import.meta.env.VITE_LEADLOVERS_NAME_FIELD || 'name']: lead.name.trim(),
    [import.meta.env.VITE_LEADLOVERS_EMAIL_FIELD || 'email']: lead.email.trim().toLowerCase(),
    [import.meta.env.VITE_LEADLOVERS_PHONE_FIELD || 'phone']: lead.phone.replace(/\D/g, ''),
  };

  postWithNativeForm(payload);
  await new Promise((resolve) => window.setTimeout(resolve, 650));
  return { mode: 'configured' };
}

