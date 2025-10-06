import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Determine if we're running on GitHub Pages
const isGitHubPages = window.location.hostname.includes('github.io');

// Use HashRouter for GitHub Pages deployment, BrowserRouter for Vercel and other environments
const Router = isGitHubPages ? HashRouter : BrowserRouter;

// Log routing mode for debugging
if (process.env.NODE_ENV !== 'production') {
  console.log(`Using ${isGitHubPages ? 'HashRouter' : 'BrowserRouter'} for routing`);
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
