import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LeadLoversApiError,
  LeadValidationError,
  buildLeadLoversPayload,
  createLeadLoversClient,
  default as handler,
  mapLeadLoversError,
  normalizeLead,
  resolveDestination,
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

test('normaliza os dados do formulário para o formato da LeadLovers', () => {
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
    LeadValidationError,
  );
});

test('health check informa configuração ausente sem expor segredos', async () => {
  const originalToken = process.env.LEADLOVERS_TOKEN;
  const health = createResponseRecorder();
  delete process.env.LEADLOVERS_TOKEN;

  try {
    await handler({ method: 'GET' }, health.response);
  } finally {
    if (originalToken === undefined) delete process.env.LEADLOVERS_TOKEN;
    else process.env.LEADLOVERS_TOKEN = originalToken;
  }

  assert.equal(health.result.status, 503);
  assert.equal(health.result.body.ok, false);
  assert.equal(health.result.body.diagnostic, 'LEADLOVERS_TOKEN não está configurado.');
  assert.equal(JSON.stringify(health.result.body).includes('token-secreto'), false);
});

test('resolve máquina, sequência, nível e campo de consentimento pelos nomes', async () => {
  const calls = [];
  const request = async (endpoint, options = {}) => {
    calls.push({ endpoint, options });

    const responses = {
      Machines: {
        Items: [{ MachineCode: 778563, MachineName: 'Aula Magna YouTube Máquina de Dólar 2026' }],
      },
      EmailSequences: {
        Items: [{ SequenceCode: 456, SequenceName: 'Sequência Inicial' }],
      },
      Levels: {
        Items: [{ ModelCode: 987, Sequence: 1, Subject: 'Inativo' }],
      },
      DynamicFields: {
        Items: [{
          Id: 321,
          Name: 'Consentimento YouTube Máquina em Dólar Aula Magna',
          Label: 'Consentimento Aula Magna',
          Tag: 'consentimento_youtube',
        }],
      },
    };

    return responses[endpoint];
  };

  assert.deepEqual(await resolveDestination(request, {}), {
    machineCode: 778563,
    sequenceCode: 456,
    levelCode: 1,
    consentFieldId: 321,
  });
  assert.deepEqual(calls.map(({ endpoint }) => endpoint), [
    'Machines',
    'EmailSequences',
    'Levels',
    'DynamicFields',
  ]);
});

test('monta o PUT sem ativar ou configurar disparos de e-mail', () => {
  const payload = buildLeadLoversPayload({
    name: 'Maria da Silva',
    email: 'maria@exemplo.com',
    phone: '5511999999999',
    consent: true,
  }, {
    machineCode: 778563,
    sequenceCode: 456,
    levelCode: 1,
    consentFieldId: 321,
  });

  assert.deepEqual(payload.DynamicFields, [{ Id: 321, Value: 'Sim' }]);
  assert.equal(payload.MachineCode, 778563);
  assert.equal(payload.EmailSequenceCode, 456);
  assert.equal(payload.SequenceLevelCode, 1);
  assert.equal('Message' in payload, false);
});

test('cliente usa PUT JSON no endpoint oficial sem expor o token no corpo', async () => {
  let capturedRequest;
  const fakeFetch = async (url, options) => {
    capturedRequest = { url, options };
    return new Response(JSON.stringify({ Code: 123 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  const client = createLeadLoversClient('token-secreto', fakeFetch);

  await client('Lead', {
    method: 'PUT',
    body: { Email: 'maria@exemplo.com' },
  });

  assert.equal(capturedRequest.url.pathname, '/webapi/Lead');
  assert.equal(capturedRequest.url.searchParams.get('token'), 'token-secreto');
  assert.equal(capturedRequest.options.method, 'PUT');
  assert.equal(capturedRequest.options.body, JSON.stringify({ Email: 'maria@exemplo.com' }));
  assert.equal(capturedRequest.options.body.includes('token-secreto'), false);
});

test('não aceita como sucesso um lead que ficou no limite do plano', async () => {
  const fakeFetch = async () => new Response(JSON.stringify({
    Message: 'Lead inserido com sucesso, mas em limite de plano',
  }), {
    status: 412,
    headers: { 'Content-Type': 'application/json' },
  });
  const client = createLeadLoversClient('token-secreto', fakeFetch);

  await assert.rejects(
    client('Lead', {
      method: 'PUT',
      body: { Email: 'maria@exemplo.com' },
    }),
    (error) => error.status === 412
      && error.message === 'Lead inserido com sucesso, mas em limite de plano',
  );
});

test('informa explicitamente quando o plano bloqueia a entrada do contato', () => {
  assert.deepEqual(
    mapLeadLoversError(new LeadLoversApiError(
      'Lead inserido com sucesso, mas em limite de plano',
      412,
    )),
    {
      status: 409,
      message: 'O cadastro não entrou porque o limite de contatos foi atingido. Tente novamente mais tarde.',
    },
  );
});

test('trata qualquer variação HTTP 412 como bloqueio da conta', () => {
  assert.deepEqual(
    mapLeadLoversError(new LeadLoversApiError(
      'Não foi possível inserir este lead agora',
      412,
    )),
    {
      status: 409,
      message: 'O contato não entrou na máquina porque a conta LeadLovers atingiu o limite de contatos. Regularize o plano e tente novamente.',
    },
  );
});

test('não atribui ao e-mail um contato existente quando a API não informa o identificador', async () => {
  const originalFetch = globalThis.fetch;
  const originalEnvironment = {
    LEADLOVERS_TOKEN: process.env.LEADLOVERS_TOKEN,
    LEADLOVERS_MACHINE_CODE: process.env.LEADLOVERS_MACHINE_CODE,
    LEADLOVERS_SEQUENCE_CODE: process.env.LEADLOVERS_SEQUENCE_CODE,
    LEADLOVERS_LEVEL_CODE: process.env.LEADLOVERS_LEVEL_CODE,
    LEADLOVERS_CONSENT_FIELD_ID: process.env.LEADLOVERS_CONSENT_FIELD_ID,
  };

  process.env.LEADLOVERS_TOKEN = 'token-secreto';
  process.env.LEADLOVERS_MACHINE_CODE = '778563';
  process.env.LEADLOVERS_SEQUENCE_CODE = '456';
  process.env.LEADLOVERS_LEVEL_CODE = '1';
  process.env.LEADLOVERS_CONSENT_FIELD_ID = '321';
  globalThis.fetch = async () => new Response(JSON.stringify({
    Message: 'Lead existente na conta mas seu status é inválido para inserção em uma máquina',
  }), {
    status: 412,
    headers: { 'Content-Type': 'application/json' },
  });

  const submission = createResponseRecorder();

  try {
    await handler({
      method: 'POST',
      body: {
        name: 'Maria da Silva',
        email: 'maria@exemplo.com',
        phone: '81987654321',
        consent: true,
      },
      headers: {},
    }, submission.response);
  } finally {
    globalThis.fetch = originalFetch;
    Object.entries(originalEnvironment).forEach(([name, value]) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    });
  }

  assert.equal(submission.result.status, 409);
  assert.equal(
    submission.result.body.message,
    'Este contato já existe na LeadLovers, mas está bloqueado pelo status atual ou pelo limite da conta. Regularize a conta antes de tentar novamente.',
  );
});

test('handler confirma o cadastro somente depois do PUT aceito pela LeadLovers', async () => {
  const originalFetch = globalThis.fetch;
  const originalEnvironment = {
    LEADLOVERS_TOKEN: process.env.LEADLOVERS_TOKEN,
    LEADLOVERS_MACHINE_CODE: process.env.LEADLOVERS_MACHINE_CODE,
    LEADLOVERS_SEQUENCE_CODE: process.env.LEADLOVERS_SEQUENCE_CODE,
    LEADLOVERS_LEVEL_CODE: process.env.LEADLOVERS_LEVEL_CODE,
    LEADLOVERS_CONSENT_FIELD_ID: process.env.LEADLOVERS_CONSENT_FIELD_ID,
  };
  let upstreamPayload;

  process.env.LEADLOVERS_TOKEN = 'token-secreto';
  process.env.LEADLOVERS_MACHINE_CODE = '778563';
  process.env.LEADLOVERS_SEQUENCE_CODE = '456';
  process.env.LEADLOVERS_LEVEL_CODE = '1';
  process.env.LEADLOVERS_CONSENT_FIELD_ID = '321';
  globalThis.fetch = async (_url, options) => {
    upstreamPayload = JSON.parse(options.body);
    return new Response(JSON.stringify({ Code: 123 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const request = {
    method: 'POST',
    body: {
      name: 'Maria da Silva',
      email: 'maria@exemplo.com',
      phone: '+55 (11) 99999-9999',
      consent: true,
    },
  };
  const health = createResponseRecorder();
  const submission = createResponseRecorder();

  try {
    await handler({ method: 'GET' }, health.response);
    await handler(request, submission.response);
  } finally {
    globalThis.fetch = originalFetch;
    Object.entries(originalEnvironment).forEach(([name, value]) => {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    });
  }

  assert.equal(health.result.status, 200);
  assert.deepEqual(health.result.body, { ok: true });
  assert.equal(submission.result.status, 200);
  assert.deepEqual(submission.result.body, { ok: true });
  assert.equal(upstreamPayload.Email, 'maria@exemplo.com');
  assert.deepEqual(upstreamPayload.DynamicFields, [{ Id: 321, Value: 'Sim' }]);
});
