import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During `vite dev` the Pages Functions are not running, so /api/* requests
// would 404. The API client (src/lib/api.ts) detects that and falls back to
// bundled demo data so the UI is fully explorable without any backend config.
export default defineConfig({
  plugins: [react()],
  server: { port: 5190 },
});
