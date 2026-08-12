import React from 'react';
import ReactDOM from 'react-dom/client';
import { CapturePage } from './pages/CapturePage';
import { ThankYouPage } from './pages/ThankYouPage';
import './styles.css';

const isThankYouPage = window.location.pathname === '/ob' || window.location.pathname.startsWith('/ob/');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isThankYouPage ? <ThankYouPage /> : <CapturePage />}
  </React.StrictMode>,
);

