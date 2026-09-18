import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CloudflareApiError,
  LeadValidationError,
  createCloudflareClient,
  default as handler,
  mapCloudflareError,
  normalizeLead,
} from '../api/leads.js';

function createResponseRecorder() {
  const result = { status: null, headers: {}, body: null };
  const response = {
    setHeader(name, value) {
      result.headers[name] = value;
    },
    status(statusCode) {
      result.status = statusCode;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };

  return { result, response };
}

async function withFetch(fakeFetch, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fakeFetch;

  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('normaliza os dados para o banco Cloudflare D1', () => {
  assert.deepEqual(normalizeLead({
    name: '  Maria   da Silva ',
    email: ' MARIA@EXEMPLO.COM ',
    phone: '+55 (11) 99999-9999',
    consent: true,
  }), {
    name: 'Maria da Silva',
    email: 'maria@exemplo.com',
    phone: '5511999999999',
    consent: true,
  });
});

test('rejeita cadastro sem consentimento', () => {
  assert.throws(
    () => normalizeLead({
      name: 'Maria',
      email: 'maria@exemplo.com',
      phone: '11999999999',
      consent: false,
    }),
    (error) => error instanceof LeadValidationError
      && error.message === 'Confirme o armazenamento dos seus dados.',
  );
});

test('cliente envia o cadastro ao Worker sem expor configuração no corpo', async () => {
  let capturedRequest;
  const fakeFetch = async (url, options) => {
    capturedRequest = { url, options };
    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const client = createCloudflareClient('https://example.workers.dev', fakeFetch);
  const payload = { name: 'Maria', email: 'maria@example.com', phone: '5511999999999', consent: true };

  await client('/leads', { method: 'POST', body: payload });

  assert.equal(capturedRequest.url, 'https://example.workers.dev/leads');
  assert.equal(capturedRequest.options.method, 'POST');
  assert.equal(capturedRequest.options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(capturedRequest.options.body), payload);
});

test('preserva a mensagem explícita de duplicidade do banco', () => {
  assert.deepEqual(
    mapCloudflareError(new CloudflareApiError(
      'Este e-mail já foi cadastrado. Use outro e-mail.',
      409,
    )),
    {
      status: 409,
      message: 'Este e-mail já foi cadastrado. Use outro e-mail.',
    },
  );
});

test('health check confirma que o Worker Cloudflare está acessível', async () => {
  const health = createResponseRecorder();

  await withFetch(async (url, options) => {
    assert.equal(url, 'https://example.workers.dev/health');
    assert.equal(options.method, 'GET');
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }, async () => {
    const originalUrl = process.env.CLOUDFLARE_LEADS_API_URL;
    process.env.CLOUDFLARE_LEADS_API_URL = 'https://example.workers.dev';

    try {
      await handler({ method: 'GET' }, health.response);
    } finally {
      if (originalUrl === undefined) delete process.env.CLOUDFLARE_LEADS_API_URL;
      else process.env.CLOUDFLARE_LEADS_API_URL = originalUrl;
    }
  });

  assert.equal(health.result.status, 200);
  assert.deepEqual(health.result.body, { ok: true });
});

test('handler envia ao Worker somente depois de validar os dados', async () => {
  const submission = createResponseRecorder();
  let submittedPayload;

  await withFetch(async (url, options) => {
    assert.equal(url, 'https://example.workers.dev/leads');
    submittedPayload = JSON.parse(options.body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }, async () => {
    const originalUrl = process.env.CLOUDFLARE_LEADS_API_URL;
    process.env.CLOUDFLARE_LEADS_API_URL = 'https://example.workers.dev';

    try {
      await handler({
        method: 'POST',
        body: {
          name: ' Maria da Silva ',
          email: 'MARIA@EXEMPLO.COM',
          phone: '(11) 99999-9999',
          consent: true,
        },
      }, submission.response);
    } finally {
      if (originalUrl === undefined) delete process.env.CLOUDFLARE_LEADS_API_URL;
      else process.env.CLOUDFLARE_LEADS_API_URL = originalUrl;
    }
  });

  assert.equal(submission.result.status, 201);
  assert.deepEqual(submission.result.body, { ok: true });
  assert.deepEqual(submittedPayload, {
    name: 'Maria da Silva',
    email: 'maria@exemplo.com',
    phone: '5511999999999',
    consent: true,
  });
});

test('handler devolve ao usuário a duplicidade informada pelo Worker', async () => {
  const submission = createResponseRecorder();

  await withFetch(async () => new Response(JSON.stringify({
    ok: false,
    message: 'Este WhatsApp já foi cadastrado. Use outro número.',
  }), {
    status: 409,
    headers: { 'Content-Type': 'application/json' },
  }), async () => {
    const originalUrl = process.env.CLOUDFLARE_LEADS_API_URL;
    process.env.CLOUDFLARE_LEADS_API_URL = 'https://example.workers.dev';

    try {
      await handler({
        method: 'POST',
        body: {
          name: 'Maria da Silva',
          email: 'maria@example.com',
          phone: '11999999999',
          consent: true,
        },
      }, submission.response);
    } finally {
      if (originalUrl === undefined) delete process.env.CLOUDFLARE_LEADS_API_URL;
      else process.env.CLOUDFLARE_LEADS_API_URL = originalUrl;
    }
  });

  assert.equal(submission.result.status, 409);
  assert.deepEqual(submission.result.body, {
    ok: false,
    message: 'Este WhatsApp já foi cadastrado. Use outro número.',
  });
});

test('handler não chama o Worker quando a validação falha', async () => {
  const submission = createResponseRecorder();
  let calls = 0;

  await withFetch(async () => {
    calls += 1;
    return new Response('{}');
  }, async () => {
    const originalUrl = process.env.CLOUDFLARE_LEADS_API_URL;
    process.env.CLOUDFLARE_LEADS_API_URL = 'https://example.workers.dev';

    try {
      await handler({
        method: 'POST',
        body: {
          name: 'M',
          email: 'invalido',
          phone: '11',
          consent: false,
        },
      }, submission.response);
    } finally {
      if (originalUrl === undefined) delete process.env.CLOUDFLARE_LEADS_API_URL;
      else process.env.CLOUDFLARE_LEADS_API_URL = originalUrl;
    }
  });

  assert.equal(calls, 0);
  assert.equal(submission.result.status, 422);
  assert.equal(submission.result.body.message, 'Digite um nome válido.');
});
