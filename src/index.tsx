import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AppProvider } from './context/AppContext';
import { TimerProvider } from './context/TimerContext';
import { ThemeProvider } from './context/ThemeContext';
import { register } from './serviceWorkerRegistration';

const rootElement = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <AppProvider>
          <TimerProvider>
            <App />
          </TimerProvider>
        </AppProvider>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);

register();
