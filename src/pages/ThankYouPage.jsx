import { BrandLogo } from '../components/BrandLogo';

export function ThankYouPage() {
  return (
    <div className="site-shell thank-you-page">
      <main className="thank-you">
        <header className="thank-you__header">
          <BrandLogo compact />
        </header>
        <section className="thank-you__content">
          <h1>Parabéns pela sua decisão.</h1>
          <p>Seu cadastro foi recebido e seus dados foram registrados com sucesso para a Aula Magna.</p>
        </section>
      </main>
    </div>
  );
}
