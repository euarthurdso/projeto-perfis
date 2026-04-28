import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Tailwind aqui!
import { Toaster } from 'react-hot-toast';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          backdropFilter: 'blur(10px)',
        },
      }}
    />
  </React.StrictMode>
);
