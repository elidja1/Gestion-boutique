import { createClient } from '@supabase/supabase-js';

const url = 'https://efjyppxztryshgnxyagk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmanlwcHh6dHJ5c2hnbnh5YWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzYwNzksImV4cCI6MjEwNDYxMjA3OX0.20tI7EnufgW1rz1sli3sKko1mfyeEyud6DQhwdex2-k';

console.log('Connecting to Supabase at:', url);
const supabase = createClient(url, key);

async function inspectSupabase() {
  try {
    const { data: companies, error: compErr } = await supabase.from('companies').select('*');
    console.log('--- COMPANIES ---', companies?.length || 0, compErr ? `ERROR: ${compErr.message}` : '');
    if (companies && companies.length > 0) console.log(companies[0]);

    const { data: stores, error: storeErr } = await supabase.from('stores').select('*');
    console.log('--- STORES ---', stores?.length || 0, storeErr ? `ERROR: ${storeErr.message}` : '');
    stores?.forEach((s) => console.log(`Store: ${s.id} - ${s.name}`));

    const { data: users, error: userErr } = await supabase.from('users').select('*');
    console.log('--- USERS ---', users?.length || 0, userErr ? `ERROR: ${userErr.message}` : '');
    users?.forEach((u) => console.log(`User: ${u.id} - ${u.full_name} (${u.email || u.code}) - Role: ${u.role_id} - PIN: ${u.pin_code}`));

    const { data: prods, error: prodErr } = await supabase.from('products').select('*');
    console.log('--- PRODUCTS ---', prods?.length || 0, prodErr ? `ERROR: ${prodErr.message}` : '');
    prods?.forEach((p) => console.log(`Product: ${p.id} - ${p.name} - SKU: ${p.sku} - Price: ${p.selling_price} - PriceTiers:`, JSON.stringify(p.price_tiers), `- Desc:`, p.description));

    const { data: stocks, error: stockErr } = await supabase.from('product_stocks').select('*');
    console.log('--- PRODUCT STOCKS ---', stocks?.length || 0, stockErr ? `ERROR: ${stockErr.message}` : '');
    stocks?.forEach((st) => console.log(`Stock: prod=${st.product_id}, store=${st.store_id}, qty=${st.quantity}`));

    const { data: sales, error: saleErr } = await supabase.from('sales').select('*');
    console.log('--- SALES ---', sales?.length || 0, saleErr ? `ERROR: ${saleErr.message}` : '');
    sales?.forEach((s) => console.log(`Sale: ${s.id} - Inv: ${s.invoice_number} - Total: ${s.total_amount} - Seller: ${s.seller_id}`));

  } catch (e) {
    console.error('Inspection failed:', e);
  }
}

inspectSupabase();
