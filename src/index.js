import React from 'react';
import ReactDOM from 'react-dom/client';
import { GeistProvider, CssBaseline } from '@geist-ui/core';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <GeistProvider>
    <CssBaseline />
    <App />
  </GeistProvider>
);
