import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { VoiceAlertProvider } from './context/VoiceAlertContext';
import { NotificationProvider } from './context/NotificationContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
          <VoiceAlertProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </VoiceAlertProvider>
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);
