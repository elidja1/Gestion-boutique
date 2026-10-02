import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const migrations = [
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS carton_price numeric(12,2) DEFAULT NULL`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS carton_weight_kg numeric(10,3) DEFAULT NULL`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS carton_stock integer DEFAULT NULL`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS price_tiers jsonb DEFAULT NULL`,
  ];

  const results: { sql: string; ok: boolean; error?: string }[] = [];

  for (const sql of migrations) {
    const { error } = await supabase.rpc('exec_ddl', { ddl: sql }).maybeSingle();
    // If exec_ddl doesn't exist, try raw SQL via pg connection
    if (error && error.message.includes('exec_ddl')) {
      // Fallback: try direct table info
      results.push({ sql, ok: false, error: 'exec_ddl not available - run migration manually' });
    } else if (error) {
      results.push({ sql, ok: false, error: error.message });
    } else {
      results.push({ sql, ok: true });
    }
  }

  // Verify columns exist by checking a product
  const { data: sample } = await supabase
    .from('products')
    .select('id, carton_price, carton_weight_kg, carton_stock, price_tiers')
    .limit(1);

  return NextResponse.json({
    message: 'Migration attempted',
    results,
    columnCheck: sample ? 'Columns exist!' : 'Cannot verify',
  });
}
