export class LeadLoversSubmissionError extends Error {}

const REQUEST_TIMEOUT_MS = 15_000;

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) return {};

  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function submitLeadToLeadLovers(lead) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lead),
      signal: controller.signal,
    });
    const result = await readResponseBody(response);

    if (!response.ok || result.ok !== true) {
      throw new LeadLoversSubmissionError(
        result.message || 'Não foi possível salvar seus dados agora. Tente novamente.',
      );
    }

    return result;
  } catch (error) {
    if (error instanceof LeadLoversSubmissionError) throw error;

    throw new LeadLoversSubmissionError(
      error?.name === 'AbortError'
        ? 'O envio demorou mais que o esperado. Tente novamente.'
        : 'Não foi possível concluir agora. Verifique sua conexão e tente novamente.',
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}
