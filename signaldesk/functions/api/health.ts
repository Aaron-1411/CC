// Ungated liveness probe (see PUBLIC_PATHS in _middleware.ts).
import { json } from '../_lib/http';

export const onRequestGet: PagesFunction = async () => json({ ok: true });
