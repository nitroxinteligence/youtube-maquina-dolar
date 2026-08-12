import { BrandLogo } from './BrandLogo';
import { SiteFooter } from './SiteFooter';

export function LegalPageLayout({ title, children }) {
  return (
    <div className="site-shell">
      <main className="legal-page">
        <header className="legal-page__header">
          <BrandLogo compact />
        </header>
        <article>
          <h1>{title}</h1>
          <div className="legal-page__body">{children}</div>
          <a className="text-link" href="/">Voltar para a página inicial</a>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
