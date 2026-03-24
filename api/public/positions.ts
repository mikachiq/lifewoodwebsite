import type { IncomingMessage, ServerResponse } from 'http';
import { supabase } from '../_lib/supabase.js';

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { data, error } = await supabase
      .from('hr_positions')
      .select('*')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
      return;
    }

    res.writeHead(200);
    res.end(JSON.stringify(data ?? []));
  } catch (err) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: String(err) }));
  }
}
