import React from 'react';
import ReactDOM from 'react-dom/client';
import { LegalPageLayout } from './components/LegalPageLayout';
import './styles.css';

function TermsPage() {
  return (
    <LegalPageLayout title="Termos de Uso">
      <p>Ao acessar este site, você concorda em utilizar seu conteúdo somente para fins legais e de acordo com estes termos.</p>
      <p>Os materiais apresentados possuem finalidade educacional e informativa. Nenhuma informação publicada constitui garantia de receita, resultado financeiro ou desempenho no YouTube.</p>
      <p>Textos, identidade visual, materiais e demais conteúdos deste projeto não podem ser copiados, distribuídos ou comercializados sem autorização prévia.</p>
      <p>O cadastro para a Aula Magna autoriza o envio das comunicações descritas na <a href="/privacidade/">Política de Privacidade</a>. O usuário poderá solicitar a interrupção desses envios pelos meios informados nas mensagens.</p>
    </LegalPageLayout>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TermsPage />
  </React.StrictMode>,
);
