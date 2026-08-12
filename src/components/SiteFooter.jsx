import { BrandLogo } from './BrandLogo';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <BrandLogo />
            <p>Estratégias diretas para transformar o YouTube em uma oportunidade de construir receita em dólar.</p>
          </div>

          <nav className="site-footer__nav" aria-label="Informações legais">
            <h2>Informações legais</h2>
            <a href="/termos/">Termos de Uso</a>
            <a href="/privacidade/">Política de Privacidade</a>
          </nav>

          <div className="site-footer__event">
            <h2>Próximo encontro</h2>
            <strong>Aula Magna</strong>
            <time dateTime="2026-09-08T10:00:00-03:00">08/09/2026 às 10 horas</time>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© 2026 YouTube Máquina de Dólar. Todos os direitos reservados.</p>
          <p>YouTube é uma marca registrada da Google LLC. Este projeto não é afiliado ou endossado pelo YouTube.</p>
        </div>
      </div>
    </footer>
  );
}
