import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

const getVisitorId = (): string => {
  const key = 'cc_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'anon-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
    localStorage.setItem(key, id);
  }
  return id;
};

pendo.initialize({
  visitor: {
    id: getVisitorId()
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
