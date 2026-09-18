const DEFAULT_CLOUDFLARE_LEADS_API_URL = 'https://youtube-maquina-dolar-leads.nitroxinteligence.workers.dev';
const REQUEST_TIMEOUT_MS = 12_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class LeadValidationError extends Error {}
export class CloudflareConfigurationError extends Error {}
export class CloudflareApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

function normalizeComparable(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

export function normalizeLead(input) {
  const name = String(input?.name || '').trim().replace(/\s+/g, ' ');
  const email = String(input?.email || '').trim().toLocaleLowerCase('pt-BR');
  let phone = String(input?.phone || '').replace(/\D/g, '');

  if (phone.startsWith('55') && phone.length === 13) phone = phone.slice(2);

  if (name.length < 2 || name.length > 120) {
    throw new LeadValidationError('Digite um nome válido.');
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    throw new LeadValidationError('Digite um e-mail válido.');
  }

  if (phone.length !== 11) {
    throw new LeadValidationError('Digite um WhatsApp com DDD e 11 dígitos.');
  }

  if (input?.consent !== true) {
    throw new LeadValidationError('Confirme o armazenamento dos seus dados.');
  }

  return {
    name,
    email,
    phone: `55${phone}`,
    consent: true,
  };
}

function getCloudflareApiUrl(environment = process.env) {
  const configuredUrl = environment.CLOUDFLARE_LEADS_API_URL || DEFAULT_CLOUDFLARE_LEADS_API_URL;
  const normalizedUrl = String(configuredUrl).trim().replace(/\/+$/, '');

  if (!normalizedUrl) {
    throw new CloudflareConfigurationError(
      'CLOUDFLARE_LEADS_API_URL não está configurado.',
    );
  }

  try {
    const url = new URL(normalizedUrl);
    if (url.protocol !== 'https:') throw new Error('URL insegura');
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new CloudflareConfigurationError(
      'CLOUDFLARE_LEADS_API_URL não contém uma URL HTTPS válida.',
    );
  }
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export function createCloudflareClient(apiUrl, fetchImplementation = fetch) {
  if (!apiUrl) {
    throw new CloudflareConfigurationError(
      'CLOUDFLARE_LEADS_API_URL não está configurado.',
    );
  }

  const baseUrl = String(apiUrl).trim().replace(/\/+$/, '');

  return async function request(path, { method = 'GET', body } = {}) {
    let response;

    try {
      response = await fetchImplementation(`${baseUrl}/${String(path).replace(/^\/+/, '')}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new CloudflareApiError(
        error?.name === 'TimeoutError'
          ? 'A Cloudflare demorou mais que o esperado para responder.'
          : 'Não foi possível acessar o banco de dados.',
        0,
      );
    }

    const payload = await readResponseBody(response);
    if (!response.ok) {
      throw new CloudflareApiError(
        payload?.message || `A API de cadastros respondeu com HTTP ${response.status}.`,
        response.status,
      );
    }

    return payload;
  };
}

export function mapCloudflareError(error) {
  const message = normalizeComparable(error?.message);

  if (error?.status === 409) {
    return {
      status: 409,
      message: error.message || 'Este cadastro já existe. Use outro e-mail ou WhatsApp.',
    };
  }

  if (error?.status === 422) {
    return { status: 422, message: error.message || 'Confira os dados informados.' };
  }

  if (message.includes('timeout') || error?.status === 504) {
    return {
      status: 503,
      message: 'O banco de dados demorou mais que o esperado. Tente novamente.',
    };
  }

  return {
    status: error?.status >= 500 ? 503 : 502,
    message: 'Não foi possível salvar seus dados agora. Tente novamente.',
  };
}

function parseRequestBody(body) {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      throw new LeadValidationError('O formulário enviado é inválido.');
    }
  }

  return body || {};
}

function sendJson(response, status, payload) {
  return response.status(status).json(payload);
}

export default async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    return sendJson(response, 405, { ok: false, message: 'Método não permitido.' });
  }

  try {
    const apiUrl = getCloudflareApiUrl();
    const client = createCloudflareClient(apiUrl);

    if (request.method === 'GET') {
      await client('/health');
      return sendJson(response, 200, { ok: true });
    }

    const lead = normalizeLead(parseRequestBody(request.body));
    await client('/leads', { method: 'POST', body: lead });

    return sendJson(response, 201, { ok: true });
  } catch (error) {
    if (error instanceof LeadValidationError) {
      return sendJson(response, 422, { ok: false, message: error.message });
    }

    if (error instanceof CloudflareConfigurationError) {
      console.error('[Cloudflare D1] Configuration error:', error.message);
      return sendJson(response, 503, {
        ok: false,
        message: 'A integração está temporariamente indisponível.',
        ...(request.method === 'GET' ? { diagnostic: error.message } : {}),
      });
    }

    if (error instanceof CloudflareApiError) {
      console.error('[Cloudflare D1] API error:', error.status, error.message);
      const mappedError = mapCloudflareError(error);
      return sendJson(response, mappedError.status, {
        ok: false,
        message: mappedError.message,
      });
    }

    console.error('[Cloudflare D1] Unexpected error:', error);
    return sendJson(response, 500, {
      ok: false,
      message: 'Não foi possível concluir agora. Tente novamente.',
    });
  }
}
