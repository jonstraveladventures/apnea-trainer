import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AppProvider } from './context/AppContext';
import { TimerProvider } from './context/TimerContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppProvider>
      <TimerProvider>
        <App />
      </TimerProvider>
    </AppProvider>
  </React.StrictMode>
); 