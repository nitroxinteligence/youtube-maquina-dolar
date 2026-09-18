import React from 'react';
import ReactDOM from 'react-dom/client';
import { LegalPageLayout } from './components/LegalPageLayout';
import './styles.css';

function PrivacyPage() {
  return (
    <LegalPageLayout title="Política de Privacidade">
      <p>Os dados informados no formulário serão usados para registrar sua inscrição e encaminhar você ao acesso da Aula Magna YouTube Máquina de Dólar.</p>
      <p>Nome, WhatsApp e e-mail serão armazenados em um banco de dados Cloudflare D1, usado exclusivamente para o controle dos cadastros desta página. Não enviamos e-mails ou mensagens a partir deste formulário.</p>
    </LegalPageLayout>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivacyPage />
  </React.StrictMode>,
);
