const LEADLOVERS_API_URL = 'https://llapi.leadlovers.com/webapi';
const DEFAULT_MACHINE_NAME = 'Aula Magna YouTube Máquina de Dólar 2026';
const DEFAULT_SEQUENCE_NAME = 'Sequência Inicial';
const DEFAULT_CONSENT_FIELD_TAG = 'consent_aula_magna_2';
const REQUEST_TIMEOUT_MS = 12_000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

let destinationPromise;

export class LeadValidationError extends Error {}
export class LeadLoversConfigurationError extends Error {}
export class LeadLoversApiError extends Error {
  constructor(message, status) {
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

function parsePositiveInteger(value) {
  if (value === undefined || value === null || value === '') return null;

  const parsed = Number.parseInt(String(value), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.Items)) return payload.Items;
  if (Array.isArray(payload?.Data)) return payload.Data;
  return [];
}

function requireNamedItem(items, property, expectedName, resourceName) {
  const normalizedExpectedName = normalizeComparable(expectedName);
  const matches = items.filter(
    (item) => normalizeComparable(item?.[property]) === normalizedExpectedName,
  );

  if (matches.length !== 1) {
    throw new LeadLoversConfigurationError(
      matches.length === 0
        ? `${resourceName} "${expectedName}" não encontrado na LeadLovers.`
        : `Mais de um ${resourceName.toLocaleLowerCase('pt-BR')} chamado "${expectedName}" foi encontrado.`,
    );
  }

  return matches[0];
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
    throw new LeadValidationError('Confirme que aceita receber as comunicações.');
  }

  return {
    name,
    email,
    phone: `55${phone}`,
    consent: true,
  };
}

async function readResponseBody(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { Message: text };
  }
}

export function createLeadLoversClient(token, fetchImplementation = fetch) {
  if (!token) {
    throw new LeadLoversConfigurationError('LEADLOVERS_TOKEN não está configurado.');
  }

  return async function request(endpoint, { method = 'GET', query = {}, body } = {}) {
    const url = new URL(`${LEADLOVERS_API_URL}/${endpoint}`);
    url.searchParams.set('token', token);

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    let response;

    try {
      response = await fetchImplementation(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new LeadLoversApiError(
        error?.name === 'TimeoutError'
          ? 'A LeadLovers demorou mais que o esperado para responder.'
          : 'Não foi possível acessar a LeadLovers.',
        0,
      );
    }

    const payload = await readResponseBody(response);

    if (!response.ok) {
      throw new LeadLoversApiError(
        payload?.Message || `A LeadLovers respondeu com HTTP ${response.status}.`,
        response.status,
      );
    }

    return payload;
  };
}

export async function resolveDestination(request, environment = process.env) {
  let machineCode = parsePositiveInteger(environment.LEADLOVERS_MACHINE_CODE);

  if (!machineCode) {
    const machines = extractItems(await request('Machines'));
    const machine = requireNamedItem(
      machines,
      'MachineName',
      environment.LEADLOVERS_MACHINE_NAME || DEFAULT_MACHINE_NAME,
      'Máquina',
    );
    machineCode = parsePositiveInteger(machine.MachineCode);
  }

  if (!machineCode) {
    throw new LeadLoversConfigurationError('O código da máquina LeadLovers é inválido.');
  }

  let sequenceCode = parsePositiveInteger(environment.LEADLOVERS_SEQUENCE_CODE);

  if (!sequenceCode) {
    const sequences = extractItems(await request('EmailSequences', {
      query: { machineCode },
    }));
    const sequence = requireNamedItem(
      sequences,
      'SequenceName',
      environment.LEADLOVERS_SEQUENCE_NAME || DEFAULT_SEQUENCE_NAME,
      'Sequência',
    );
    sequenceCode = parsePositiveInteger(sequence.SequenceCode);
  }

  if (!sequenceCode) {
    throw new LeadLoversConfigurationError('O código da sequência LeadLovers é inválido.');
  }

  let levelCode = parsePositiveInteger(environment.LEADLOVERS_LEVEL_CODE);

  if (!levelCode) {
    const levels = extractItems(await request('Levels', {
      query: { machineCode, sequenceCode },
    }));
    const firstLevel = levels
      .filter((level) => parsePositiveInteger(level.Sequence))
      .sort((left, right) => left.Sequence - right.Sequence)[0];
    levelCode = parsePositiveInteger(firstLevel?.Sequence);
  }

  if (!levelCode) {
    throw new LeadLoversConfigurationError('Nenhum nível foi encontrado na sequência LeadLovers.');
  }

  let consentFieldId = parsePositiveInteger(environment.LEADLOVERS_CONSENT_FIELD_ID);

  if (!consentFieldId) {
    const dynamicFields = extractItems(await request('DynamicFields'));
    const consentField = requireNamedItem(
      dynamicFields,
      'Tag',
      environment.LEADLOVERS_CONSENT_FIELD_TAG || DEFAULT_CONSENT_FIELD_TAG,
      'Campo de consentimento',
    );
    consentFieldId = parsePositiveInteger(consentField.Id);
  }

  if (!consentFieldId) {
    throw new LeadLoversConfigurationError('O campo de consentimento LeadLovers é inválido.');
  }

  return { machineCode, sequenceCode, levelCode, consentFieldId };
}

export function buildLeadLoversPayload(lead, destination) {
  return {
    Email: lead.email,
    Name: lead.name,
    Phone: lead.phone,
    MachineCode: destination.machineCode,
    EmailSequenceCode: destination.sequenceCode,
    SequenceLevelCode: destination.levelCode,
    DynamicFields: [
      {
        Id: destination.consentFieldId,
        Value: 'Sim',
      },
    ],
    Source: 'Landing Page Aula Magna YouTube Máquina de Dólar',
    IsEmailLead: true,
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
  response.setHeader('Cache-Control', 'no-store');
  return response.status(status).json(payload);
}

function getDestination(client) {
  if (!destinationPromise) {
    destinationPromise = resolveDestination(client).catch((error) => {
      destinationPromise = undefined;
      throw error;
    });
  }

  return destinationPromise;
}

export default async function handler(request, response) {
  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST');
    return sendJson(response, 405, { ok: false, message: 'Método não permitido.' });
  }

  try {
    const client = createLeadLoversClient(process.env.LEADLOVERS_TOKEN);

    if (request.method === 'GET') {
      await getDestination(client);
      return sendJson(response, 200, { ok: true });
    }

    const lead = normalizeLead(parseRequestBody(request.body));
    const destination = await getDestination(client);
    const payload = buildLeadLoversPayload(lead, destination);
    await client('Lead', { method: 'PUT', body: payload });

    return sendJson(response, 200, { ok: true });
  } catch (error) {
    if (error instanceof LeadValidationError) {
      return sendJson(response, 422, { ok: false, message: error.message });
    }

    if (error instanceof LeadLoversConfigurationError) {
      console.error('[LeadLovers] Integration configuration error:', error.message);
      return sendJson(response, 503, {
        ok: false,
        message: 'A integração está temporariamente indisponível.',
      });
    }

    if (error instanceof LeadLoversApiError) {
      console.error('[LeadLovers] API error:', error.status, error.message);
      return sendJson(response, 502, {
        ok: false,
        message: 'Não foi possível salvar seus dados agora. Tente novamente.',
      });
    }

    console.error('[LeadLovers] Unexpected error:', error);
    return sendJson(response, 500, {
      ok: false,
      message: 'Não foi possível concluir agora. Tente novamente.',
    });
  }
}
