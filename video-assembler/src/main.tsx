import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Ensure proper error handling
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', { message, source, lineno, colno, error });
  // You could add error reporting service integration here
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // You could add error reporting service integration here
};

// Create root element if it doesn't exist
const rootElement = document.getElementById('root');
if (!rootElement) {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
}

// Mount React application
ReactDOM.createRoot(rootElement || document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Handle hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept();
}

// Prevent drag and drop on the document except where explicitly handled
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

// Expose API versions in development
if (process.env.NODE_ENV === 'development') {
  console.log('Chrome version:', process.versions.chrome);
  console.log('Node version:', process.versions.node);
  console.log('Electron version:', process.versions.electron);
}