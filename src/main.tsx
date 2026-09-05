import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Soporte offline básico (PWA): el service worker cachea la portada de la
// SPA y los assets propios a medida que se piden, así la app abre igual
// sin conexión después de haberla usado una vez. Se registra después del
// `load` para no competir por ancho de banda con la carga inicial, y con
// el scope/URL calculados desde BASE_URL para funcionar tanto en dev (`/`)
// como publicada bajo un subpath (GitHub Pages, `/dmbuddy/`).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL }).catch(() => {
      // Sin service worker la app sigue funcionando normal, solo pierde el
      // soporte offline — no hay nada que mostrarle al usuario acá.
    });
  });
}
