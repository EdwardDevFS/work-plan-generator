import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';
import App from './App';
import { setupSpanishLocale } from './primeLocale/es';
import 'primereact/resources/themes/lara-light-blue/theme.css'; // o el tema que uses
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import './index.css';
// 🔥 REGISTRA EL LOCALE ANTES DE TODO
setupSpanishLocale();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrimeReactProvider value={{ ripple: true, locale: 'es' }}>
      <App />
    </PrimeReactProvider>
  </StrictMode>
);
