import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './lib/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Production optimizations
import config from './config/environment';
import monitoring from './utils/monitoring';
import Logger from './utils/logger';

// Initialize monitoring in production
if (config.isProduction) {
  monitoring.init();
}

// Initialize app performance tracking
Logger.info('WatanHub starting', {
  environment: process.env.NODE_ENV,
  version: config.app.version,
  timestamp: new Date().toISOString()
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Enhanced performance tracking
const vitalsHandler = (metric) => {
  if (config.performance.enableAnalytics) {
    monitoring.trackUserAction('web_vital', {
      name: metric.name,
      value: metric.value,
      id: metric.id
    });
  }

  Logger.debug('Web Vital:', metric);
};

reportWebVitals(vitalsHandler);
