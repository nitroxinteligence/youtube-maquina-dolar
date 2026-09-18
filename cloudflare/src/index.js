const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCE = 'youtube-maquina-dolar';

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function responseHeaders(request, env) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin',
  };
  const origin = request.headers.get('Origin');

  if (origin && allowedOrigins(env).includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }

  return headers;
}

function json(request, env, payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: responseHeaders(request, env),
  });
}

function normalizeLead(input) {
  const name = String(input?.name || '').trim().replace(/\s+/g, ' ');
  const email = String(input?.email || '').trim().toLocaleLowerCase('pt-BR');
  let phone = String(input?.phone || '').replace(/\D/g, '');

  if (phone.startsWith('55') && phone.length === 13) phone = phone.slice(2);

  if (name.length < 2 || name.length > 120) {
    return { error: 'Digite um nome válido.' };
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { error: 'Digite um e-mail válido.' };
  }

  if (phone.length !== 11) {
    return { error: 'Digite um WhatsApp com DDD e 11 dígitos.' };
  }

  if (input?.consent !== true) {
    return { error: 'Confirme o armazenamento dos seus dados.' };
  }

  return {
    lead: {
      name,
      email,
      phone: `55${phone}`,
      consent: 1,
    },
  };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function health(request, env) {
  try {
    await env.DB.prepare('SELECT 1 AS ok').first();
    return json(request, env, { ok: true });
  } catch (error) {
    console.error('[D1] Health check failed:', error);
    return json(request, env, {
      ok: false,
      message: 'O banco de dados está temporariamente indisponível.',
    }, 503);
  }
}

async function createLead(request, env) {
  const payload = await readJson(request);
  const normalized = normalizeLead(payload);

  if (normalized.error) {
    return json(request, env, { ok: false, message: normalized.error }, 422);
  }

  const { lead } = normalized;

  try {
    const existing = await env.DB.prepare(
      'SELECT email, phone FROM leads WHERE lower(email) = lower(?) OR phone = ? LIMIT 1',
    ).bind(lead.email, lead.phone).first();

    if (existing?.email && String(existing.email).toLocaleLowerCase('pt-BR') === lead.email) {
      return json(request, env, {
        ok: false,
        message: 'Este e-mail já foi cadastrado. Use outro e-mail.',
      }, 409);
    }

    if (existing?.phone === lead.phone) {
      return json(request, env, {
        ok: false,
        message: 'Este WhatsApp já foi cadastrado. Use outro número.',
      }, 409);
    }

    await env.DB.prepare(
      `INSERT INTO leads (name, email, phone, consent, source)
       VALUES (?, ?, ?, ?, ?)`,
    ).bind(lead.name, lead.email, lead.phone, lead.consent, SOURCE).run();

    return json(request, env, { ok: true }, 201);
  } catch (error) {
    const message = String(error?.message || '');
    console.error('[D1] Lead insert failed:', message);

    if (message.includes('UNIQUE constraint failed: leads.email')) {
      return json(request, env, {
        ok: false,
        message: 'Este e-mail já foi cadastrado. Use outro e-mail.',
      }, 409);
    }

    if (message.includes('UNIQUE constraint failed: leads.phone')) {
      return json(request, env, {
        ok: false,
        message: 'Este WhatsApp já foi cadastrado. Use outro número.',
      }, 409);
    }

    return json(request, env, {
      ok: false,
      message: 'Não foi possível salvar seus dados agora. Tente novamente.',
    }, 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: responseHeaders(request, env),
      });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return health(request, env);
    }

    if (request.method === 'POST' && url.pathname === '/leads') {
      return createLead(request, env);
    }

    return json(request, env, { ok: false, message: 'Rota não encontrada.' }, 404);
  },
};
