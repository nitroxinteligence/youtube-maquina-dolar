export function BrandLogo({ compact = false }) {
  return (
    <a className={`brand-logo${compact ? ' brand-logo--compact' : ''}`} href="/" aria-label="YouTube Máquina em Dólar, página inicial">
      <img
        className="brand-logo__image"
        src="/assets/logo-youtube-maquina-em-dolar-v3.png"
        alt=""
        width="2168"
        height="725"
        decoding="async"
      />
    </a>
  );
}
