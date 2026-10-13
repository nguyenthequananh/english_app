import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
import { createQueryClient } from './config/query-client';
import { createAppRouter } from './router';
import './index.css';

const queryClient = createQueryClient();
const router = createAppRouter();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App router={router} queryClient={queryClient} />
  </StrictMode>,
);
