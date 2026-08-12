import { useEffect, useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';

const WHATSAPP_URL = String(import.meta.env.VITE_WHATSAPP_URL || '').trim();
const REDIRECT_SECONDS = 10;

export function ThankYouPage() {
  const [secondsRemaining, setSecondsRemaining] = useState(REDIRECT_SECONDS);
  const whatsappReady = Boolean(WHATSAPP_URL);

  useEffect(() => {
    if (!whatsappReady) return undefined;

    const startedAt = Date.now();
    const countdown = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      setSecondsRemaining(Math.max(REDIRECT_SECONDS - elapsedSeconds, 0));
    }, 250);

    return () => window.clearInterval(countdown);
  }, [whatsappReady]);

  useEffect(() => {
    if (whatsappReady && secondsRemaining === 0) {
      window.location.assign(WHATSAPP_URL);
    }
  }, [secondsRemaining, whatsappReady]);

  const handlePendingLink = (event) => {
    if (!whatsappReady) event.preventDefault();
  };

  return (
    <div className="site-shell thank-you-page">
      <main className="thank-you">
        <header className="thank-you__header">
          <BrandLogo compact />
        </header>
        <section className="thank-you__content">
          <h1>Parabéns pela sua decisão.</h1>
          <p>Seu cadastro foi recebido e seus dados foram registrados com sucesso para a Aula Magna.</p>
          <div className="thank-you__whatsapp">
            <p className="thank-you__redirect" aria-live="polite">
              <span>
                {whatsappReady
                  ? 'Redirecionamento automático para o WhatsApp em'
                  : 'O redirecionamento para o WhatsApp será ativado em breve'}
              </span>
              <strong className="thank-you__countdown">
                <span>{whatsappReady ? secondsRemaining : '--'}</span>
                <small>segundos</small>
              </strong>
            </p>
            <a
              className="whatsapp-button"
              href={whatsappReady ? WHATSAPP_URL : undefined}
              aria-disabled={!whatsappReady}
              onClick={handlePendingLink}
            >
              <svg aria-hidden="true" viewBox="0 0 32 32">
                <path d="M16.03 3.2A12.7 12.7 0 0 0 5.1 22.35L3.4 28.8l6.58-1.68A12.71 12.71 0 1 0 16.03 3.2Zm0 22.85c-2.03 0-3.91-.6-5.5-1.62l-.4-.24-3.9 1 1.04-3.78-.26-.4a10.11 10.11 0 1 1 9.02 5.04Zm5.55-7.56c-.3-.16-1.8-.89-2.08-.99-.28-.1-.48-.15-.68.15-.2.31-.78.99-.96 1.2-.17.2-.35.23-.65.08-.3-.16-1.28-.47-2.44-1.5a9.2 9.2 0 0 1-1.68-2.09c-.18-.3-.02-.47.13-.62.14-.14.3-.36.46-.54.15-.17.2-.3.3-.5.1-.21.05-.39-.03-.54-.07-.16-.68-1.65-.94-2.26-.24-.6-.5-.52-.68-.53h-.58c-.2 0-.53.08-.8.39-.28.3-1.06 1.03-1.06 2.52 0 1.48 1.08 2.92 1.23 3.12.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.8-.74 2.05-1.45.25-.72.25-1.33.18-1.46-.08-.13-.28-.2-.58-.36Z" />
              </svg>
              <span>{whatsappReady ? 'ENTRAR NO WHATSAPP' : 'LINK DO WHATSAPP EM BREVE'}</span>
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
