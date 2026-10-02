import { fetchFullSupabaseSnapshot } from '../lib/supabaseSync';

async function testFetch() {
  console.log('Fetching live snapshot from Supabase...');
  const snapshot = await fetchFullSupabaseSnapshot();
  if (!snapshot) {
    console.error('Snapshot returned null');
    return;
  }
  console.log('--- PRODUCTS IN SNAPSHOT ---');
  snapshot.products?.forEach((p) => {
    console.log(`\n📦 Produit: ${p.name} (SKU: ${p.sku}, Prix: ${p.selling_price} FCFA)`);
    console.log(`   - Paliers extraits:`, p.price_tiers);
    console.log(`   - Stock par boutique:`, p.stock_by_store);
    console.log(`   - Description nettoyée: "${p.description}"`);
  });
  console.log('\n--- USERS IN SNAPSHOT ---');
  snapshot.users?.forEach((u) => {
    console.log(`👤 User: ${u.full_name} (${u.email}) - Role: ${u.role_code} - ID: ${u.id} - Store: ${u.store_id}`);
  });
}

testFetch();
