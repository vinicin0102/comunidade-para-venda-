import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/registerSW";

// Registrar Service Worker para PWA
registerServiceWorker();

// Verificar se o root existe antes de renderizar
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

// Adicionar tratamento de erro global
window.addEventListener('error', (event) => {
  console.error('Erro global capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejeitada não tratada:', event.reason);
});

try {
  createRoot(rootElement).render(<App />);
} catch (error) {
  console.error('Erro ao renderizar app:', error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: white; flex-direction: column; gap: 20px; padding: 20px; text-align: center;">
      <h1 style="font-size: 24px; margin: 0;">Erro ao carregar aplicação</h1>
      <p style="color: #888; margin: 0;">Por favor, recarregue a página.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #FF6B00; color: white; border: none; border-radius: 8px; cursor: pointer;">
        Recarregar
      </button>
    </div>
  `;
}


