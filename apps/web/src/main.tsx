import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import type { TaskStatus } from '@lab/shared';

// Phase 1 placeholder: proves the React + Vite + shared-types toolchain works.
// The real dashboard is built in Phase 7.
const plannedStates: TaskStatus[] = ['pending', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled'];

function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '40px auto', padding: '0 16px' }}>
      <h1>Local AI Agent Lab</h1>
      <p>
        Phase 1 scaffold. No agent features are implemented yet. The dashboard will be built in Phase 7.
      </p>
      <p>Task states defined in the shared package: {plannedStates.join(', ')}</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
