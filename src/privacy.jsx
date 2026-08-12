import React from 'react';
import ReactDOM from 'react-dom/client';
import { LegalPageLayout } from './components/LegalPageLayout';
import './styles.css';

function PrivacyPage() {
  return (
    <LegalPageLayout title="Política de Privacidade">
      <p>Os dados informados no formulário serão usados para enviar conteúdos e comunicações relacionados à Aula Magna YouTube Máquina de Dólar.</p>
      <p>Nome, WhatsApp e e-mail poderão ser processados pela plataforma LeadLovers para realizar esses envios. Você poderá solicitar a interrupção das comunicações pelos canais informados nas próprias mensagens.</p>
    </LegalPageLayout>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivacyPage />
  </React.StrictMode>,
);
