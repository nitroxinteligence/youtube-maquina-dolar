import { useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import { CaptureDialog } from '../components/CaptureDialog';
import { EventBar } from '../components/EventBar';
import { GlowButton } from '../components/GlowButton';
import { SiteFooter } from '../components/SiteFooter';

export function CapturePage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="site-shell capture-page">
      <EventBar />

      <main className="hero">
        <div className="hero__inner">
          <picture className="hero__visual">
            <source
              media="(min-width: 64rem)"
              srcSet="/assets/hero/hero-desktop-2x1-v8.png"
              type="image/png"
              height="793"
              width="1586"
            />
            <source
              media="(min-width: 40rem)"
              srcSet="/assets/hero/hero-tablet-v7.png"
              type="image/png"
              height="920"
              width="1122"
            />
            <img
              src="/assets/hero/hero-mobile-v7.png"
              alt="Luan Onofre e Tiago Lima na Aula Magna YouTube Máquina em Dólar"
              decoding="async"
              fetchPriority="high"
              height="1080"
              loading="eager"
              width="941"
            />
          </picture>

          <header className="hero__header">
            <BrandLogo />
          </header>

          <section className="hero__content" aria-labelledby="hero-title">
            <h1 id="hero-title">
              <span className="hero__title-light">
                <span>Destrave as estratégias</span>{' '}
                <span>que vão fazer com que você</span>
              </span>
              <strong className="hero__gold-emphasis">
                <span>ganhe em dólar todos os</span>{' '}
                <span>dias apenas com o YouTube</span>
              </strong>
            </h1>
            <p className="hero__badge">
              <span>Cadastre-se para receber conteúdo gratuito até</span>
              <time dateTime="2026-09-08">08/09/2026</time>
            </p>
            <GlowButton onClick={() => setDialogOpen(true)}>
              QUERO GANHAR EM DÓLAR
            </GlowButton>
          </section>
        </div>
      </main>

      <SiteFooter />

      <CaptureDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
