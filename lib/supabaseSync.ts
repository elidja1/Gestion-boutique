// Supabase Data Synchronization Layer for Multi-Shop POS
import { getSupabase } from './supabaseClient';
import { normalizePriceTiers } from './utils';
import {
  Company,
  Store,
  UserProfile,
  Category,
  Supplier,
  Product,
  Customer,
  Sale,
  StockTransfer,
  StockMovement,
  CashSession,
  Expense,
  NotificationItem,
  AuditLog,
  UserRoleType,
} from './types';

export interface DatabaseHealthReport {
  isConnected: boolean;
  timestamp: string;
  error?: string;
  tableCounts: {
    companies: number;
    stores: number;
    users: number;
    categories: number;
    suppliers: number;
    products: number;
    product_stocks: number;
    customers: number;
    sales: number;
    sale_items: number;
    cash_sessions: number;
    expenses: number;
    stock_transfers: number;
    stock_movements: number;
    notifications: number;
    audit_logs: number;
  };
}

/**
 * Check connectivity and count rows in Supabase tables
 */
export async function checkSupabaseHealth(): Promise<DatabaseHealthReport> {
  const supabase = getSupabase();
  const report: DatabaseHealthReport = {
    isConnected: false,
    timestamp: new Date().toISOString(),
    tableCounts: {
      companies: 0,
      stores: 0,
      users: 0,
      categories: 0,
      suppliers: 0,
      products: 0,
      product_stocks: 0,
      customers: 0,
      sales: 0,
      sale_items: 0,
      cash_sessions: 0,
      expenses: 0,
      stock_transfers: 0,
      stock_movements: 0,
      notifications: 0,
      audit_logs: 0,
    },
  };

  try {
    const { count: compCount, error: compErr } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    if (compErr) {
      report.error = compErr.message;
      return report;
    }

    report.isConnected = true;
    report.tableCounts.companies = compCount || 0;

    const tables = [
      'stores',
      'users',
      'categories',
      'suppliers',
      'products',
      'product_stocks',
      'customers',
      'sales',
      'sale_items',
      'cash_sessions',
      'expenses',
      'stock_transfers',
      'stock_movements',
      'notifications',
      'audit_logs',
    ] as const;

    await Promise.all(
      tables.map(async (table) => {
        try {
          const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
          report.tableCounts[table] = count || 0;
        } catch {
          // Table might not exist or error
        }
      })
    );

    return report;
  } catch (err: any) {
    report.error = err?.message || 'Erreur inconnue de connexion à Supabase';
    return report;
  }
}

/**
 * Fetch full snapshot of all data from Supabase
 */
export async function fetchFullSupabaseSnapshot(): Promise<{
  company?: Company;
  stores?: Store[];
  users?: UserProfile[];
  categories?: Category[];
  suppliers?: Supplier[];
  products?: Product[];
  customers?: Customer[];
  sales?: Sale[];
  transfers?: StockTransfer[];
  movements?: StockMovement[];
  cashSessions?: CashSession[];
  expenses?: Expense[];
  notifications?: NotificationItem[];
  auditLogs?: AuditLog[];
} | null> {
  const supabase = getSupabase();

  try {
    const [
      { data: compData, error: compErr },
      { data: storeData },
      { data: userData },
      { data: roleData },
      { data: catData },
      { data: supData },
      { data: prodData },
      { data: stockData },
      { data: custData },
      { data: saleData },
      { data: saleItemsData },
      { data: salePaymentsData },
      { data: transferData },
      { data: moveData },
      { data: cashData },
      { data: expData },
      { data: notifData },
      { data: auditData },
    ] = await Promise.all([
      supabase.from('companies').select('*').limit(1),
      supabase.from('stores').select('*').order('created_at', { ascending: true }),
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase.from('roles').select('*'),
      supabase.from('categories').select('*').order('created_at', { ascending: true }),
      supabase.from('suppliers').select('*').order('created_at', { ascending: true }),
      supabase.from('products').select('*').order('name', { ascending: true }),
      supabase.from('product_stocks').select('*'),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('sale_items').select('*'),
      supabase.from('sale_payments').select('*'),
      supabase.from('stock_transfers').select('*').order('created_at', { ascending: false }),
      supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('cash_sessions').select('*').order('opened_at', { ascending: false }),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    if (compErr || !compData || compData.length === 0) {
      console.warn('Supabase snapshot returned empty company or error:', compErr);
      return null;
    }

    const company: Company = {
      id: compData[0].id,
      name: compData[0].name,
      ifu: compData[0].ifu || '',
      rccm: compData[0].rccm || '',
      phone: compData[0].phone || '',
      email: compData[0].email || '',
      address: compData[0].address || '',
      website: compData[0].website || '',
      currency: compData[0].currency || 'FCFA',
      country: compData[0].country || 'Bénin',
      city: compData[0].city || 'Cotonou',
      logo_url: compData[0].logo_url,
      invoice_footer_message: compData[0].invoice_footer_message || '',
      tax_rate: Number(compData[0].tax_rate || 0),
      loyalty_rate_amount: Number(compData[0].loyalty_rate_amount || 100),
      loyalty_point_value: Number(compData[0].loyalty_point_value || 1),
    };

    const stores: Store[] = (storeData || []).map((s: any) => ({
      id: s.id,
      company_id: s.company_id,
      code: s.code,
      name: s.name,
      address: s.address,
      city: s.city || 'Cotonou',
      phone: s.phone || '',
      email: s.email || '',
      manager_name: s.manager_name || '',
      opening_hours: s.opening_hours || '08:00 - 20:30',
      image_url: s.image_url,
      description: s.description,
      is_active: s.is_active ?? true,
      employees_count: (userData || []).filter((u: any) => u.store_id === s.id).length,
      products_count: (stockData || []).filter((st: any) => st.store_id === s.id && Number(st.quantity) > 0).length,
      today_sales_count: (saleData || []).filter((sal: any) => sal.store_id === s.id).length,
      today_revenue: (saleData || [])
        .filter((sal: any) => sal.store_id === s.id)
        .reduce((sum: number, sal: any) => sum + Number(sal.total_amount || 0), 0),
    }));

    const roleLookup: Record<string, string> = {};
    (roleData || []).forEach((r: any) => {
      roleLookup[r.id] = r.name;
    });

    const users: UserProfile[] = (userData || []).map((u: any) => {
      const rawRole = (roleLookup[u.role_id] || u.role_code || '').toUpperCase();
      const normalizedRole: UserRoleType = (rawRole === 'OWNER' || rawRole === 'SUPERADMIN') ? rawRole : 'SELLER';
      return {
        id: u.id,
        auth_id: u.auth_id,
        company_id: u.company_id || company.id,
        store_id: u.store_id,
        role_id: u.role_id,
        role_code: normalizedRole,
        code: u.code || 'EMP-01',
        full_name: u.full_name,
        email: u.email || '',
        phone: u.phone || '',
        password: u.password_hash || 'Boutique@2026',
        pin_code: u.pin_code || '1234',
        avatar_url: u.avatar_url,
        is_active: u.is_active ?? true,
        monthly_sales_target: Number(u.monthly_sales_target || 1500000),
        created_at: u.created_at,
      };
    });

    const categories: Category[] = (catData || []).map((c: any) => ({
      id: c.id,
      company_id: c.company_id,
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      icon: c.icon || 'Package',
      color: c.color || '#2563eb',
      description: c.description,
      products_count: (prodData || []).filter((p: any) => p.category_id === c.id).length,
    }));

    const suppliers: Supplier[] = (supData || []).map((sup: any) => ({
      id: sup.id,
      company_id: sup.company_id,
      name: sup.name,
      contact_name: sup.contact_person || sup.name,
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      category: sup.city || 'Général',
      total_purchases: Number(sup.balance_payable || 0) * 3,
      outstanding_balance: Number(sup.balance_payable || 0),
    }));

    const stockMap: Record<string, Record<string, number>> = {};
    (stockData || []).forEach((st: any) => {
      if (!stockMap[st.product_id]) stockMap[st.product_id] = {};
      stockMap[st.product_id][st.store_id] = Number(st.quantity || 0);
    });

    const products: Product[] = (prodData || [])
      .filter((p: any) => p.is_active !== false)
      .map((p: any) => {
      const storeStock = stockMap[p.id] || {};
      const totalStock = Object.values(storeStock).reduce((a, b) => a + b, 0);
      const cat = categories.find((c) => c.id === p.category_id);
      let tiers = normalizePriceTiers(p.price_tiers);
      let cleanDesc = p.description || '';
      if (tiers.length === 0 && cleanDesc.includes('[TIERS_META:')) {
        try {
          const startIdx = cleanDesc.indexOf('[TIERS_META:') + 12;
          const endIdx = cleanDesc.lastIndexOf(']');
          if (endIdx > startIdx) {
            const jsonStr = cleanDesc.substring(startIdx, endIdx).trim();
            tiers = normalizePriceTiers(JSON.parse(jsonStr));
          }
        } catch (e) {
          console.warn('Failed to parse fallback TIERS_META:', e);
        }
      }
      if (cleanDesc.includes('[TIERS_META:')) {
        const startIdx = cleanDesc.indexOf('[TIERS_META:');
        const endIdx = cleanDesc.lastIndexOf(']');
        if (endIdx > startIdx) {
          cleanDesc = (cleanDesc.substring(0, startIdx) + cleanDesc.substring(endIdx + 1)).trim();
        }
      }

      return {
        id: p.id,
        company_id: p.company_id,
        category_id: p.category_id,
        category_name: cat ? cat.name : 'Général',
        supplier_id: p.supplier_id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        description: cleanDesc,
        unit: p.unit || 'Pièce',
        purchase_price: Number(p.purchase_price || 0),
        selling_price: Number(p.selling_price || 0),
        promo_price: p.promo_price ? Number(p.promo_price) : undefined,
        min_stock_alert: Number(p.min_stock_alert || 5),
        is_weight_based: p.is_weight_based ?? false,
        is_perishable: p.is_perishable ?? false,
        expiry_date: p.expiry_date,
        image_url: p.image_url,
        is_active: p.is_active ?? true,
        carton_price: p.carton_price ? Number(p.carton_price) : null,
        carton_weight_kg: p.carton_weight_kg ? Number(p.carton_weight_kg) : null,
        carton_stock: p.carton_stock ? Number(p.carton_stock) : null,
        price_tiers: tiers,
        stock_by_store: storeStock,
        total_stock: Number(totalStock.toFixed(3)),
      };
    });

    const customers: Customer[] = (custData || []).map((c: any) => ({
      id: c.id,
      company_id: c.company_id,
      first_name: c.first_name,
      last_name: c.last_name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || 'Cotonou',
      loyalty_points: Number(c.loyalty_points || 0),
      credit_balance: Number(c.credit_balance || 0),
      total_spent: Number(c.total_spent || 0),
      total_orders: (saleData || []).filter((s: any) => s.customer_id === c.id).length,
      is_active: c.is_active ?? true,
      created_at: c.created_at,
    }));

    const itemsBySale: Record<string, any[]> = {};
    (saleItemsData || []).forEach((item: any) => {
      if (!itemsBySale[item.sale_id]) itemsBySale[item.sale_id] = [];
      const prod = products.find((p) => p.id === item.product_id) || {
        id: item.product_id,
        name: item.product_name,
        sku: item.sku,
        unit: item.unit || 'Pièce',
        selling_price: Number(item.unit_price || 0),
        purchase_price: Number(item.purchase_price || 0),
        barcode: '',
        company_id: company.id,
        category_id: '',
        min_stock_alert: 5,
      };
      itemsBySale[item.sale_id].push({
        product: prod,
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0),
        discount_amount: Number(item.discount_amount || 0),
        total_price: Number(item.total_price || 0),
      });
    });

    const paymentsBySale: Record<string, any[]> = {};
    (salePaymentsData || []).forEach((pm: any) => {
      if (!paymentsBySale[pm.sale_id]) paymentsBySale[pm.sale_id] = [];
      paymentsBySale[pm.sale_id].push({
        payment_method: pm.method,
        amount: Number(pm.amount || 0),
        reference_code: pm.reference,
      });
    });

    const sales: Sale[] = (saleData || []).map((s: any) => {
      const seller = users.find((u) => u.id === s.seller_id);
      const cust = customers.find((c) => c.id === s.customer_id);
      const st = stores.find((store) => store.id === s.store_id);

      return {
        id: s.id,
        company_id: s.company_id,
        store_id: s.store_id,
        store_name: st ? st.name : '',
        seller_id: s.seller_id,
        seller_name: seller ? seller.full_name : '',
        customer_id: s.customer_id,
        customer_name: cust ? `${cust.first_name} ${cust.last_name}` : undefined,
        customer_phone: cust?.phone,
        invoice_number: s.invoice_number,
        items: itemsBySale[s.id] || [],
        subtotal_amount: Number(s.subtotal_amount || 0),
        discount_amount: Number(s.discount_amount || 0),
        tax_amount: Number(s.tax_amount || 0),
        total_amount: Number(s.total_amount || 0),
        paid_amount: Number(s.paid_amount || 0),
        change_returned: Number(s.change_returned || 0),
        payment_status: s.payment_status || 'PAID',
        payment_method: s.payment_method || 'CASH',
        payments: paymentsBySale[s.id] || [
          {
            payment_method: s.payment_method || 'CASH',
            amount: Number(s.paid_amount || s.total_amount || 0),
          },
        ],
        status: s.status || 'COMPLETED',
        notes: s.notes,
        created_at: s.created_at,
      };
    });

    const transfers: StockTransfer[] = (transferData || []).map((t: any) => {
      const src = stores.find((st) => st.id === t.source_store_id);
      const dst = stores.find((st) => st.id === t.dest_store_id);
      const prod = products.find((p) => p.id === t.product_id);
      const req = users.find((u) => u.id === t.requested_by);

      return {
        id: t.id,
        company_id: t.company_id,
        transfer_number: t.transfer_number,
        source_store_id: t.source_store_id,
        source_store_name: src ? src.name : '',
        destination_store_id: t.dest_store_id,
        destination_store_name: dst ? dst.name : '',
        items: [
          {
            product_id: t.product_id,
            product_name: prod ? prod.name : 'Produit',
            sku: prod ? prod.sku : '',
            quantity_requested: Number(t.quantity || 1),
            quantity_shipped: Number(t.quantity || 1),
            quantity_received: t.status === 'RECEIVED' ? Number(t.quantity || 1) : 0,
            unit: prod ? prod.unit : 'Pièce',
          },
        ],
        requested_by_name: req ? req.full_name : '',
        status: t.status || 'PENDING',
        notes: t.notes,
        created_at: t.created_at,
        updated_at: t.updated_at || t.created_at,
      };
    });

    const movements: StockMovement[] = (moveData || []).map((m: any) => {
      const prod = products.find((p) => p.id === m.product_id);
      const st = stores.find((s) => s.id === m.store_id);
      const usr = users.find((u) => u.id === m.user_id);
      return {
        id: m.id,
        company_id: company.id,
        store_id: m.store_id,
        store_name: st ? st.name : '',
        product_id: m.product_id,
        product_name: prod ? prod.name : '',
        user_name: usr ? usr.full_name : '',
        type: m.type as any,
        quantity: Number(m.quantity || 0),
        previous_quantity: Number(m.previous_quantity || 0),
        new_quantity: Number(m.new_quantity || 0),
        unit: prod ? prod.unit : 'Pièce',
        reason: m.reason || m.reference_number || '',
        created_at: m.created_at,
      };
    });

    const cashSessions: CashSession[] = (cashData || []).map((cs: any) => {
      const st = stores.find((s) => s.id === cs.store_id);
      const usr = users.find((u) => u.id === cs.user_id);
      return {
        id: cs.id,
        register_id: cs.register_id || 'reg-01',
        store_id: cs.store_id,
        store_name: st ? st.name : '',
        user_id: cs.user_id,
        user_name: usr ? usr.full_name : '',
        session_code: cs.session_code,
        opening_balance: Number(cs.opening_balance || 0),
        closing_balance_system: cs.closing_balance_system !== null ? Number(cs.closing_balance_system) : Number(cs.opening_balance || 0),
        closing_balance_real: cs.closing_balance_real !== null ? Number(cs.closing_balance_real) : undefined,
        discrepancy: Number(cs.discrepancy || 0),
        discrepancy_reason: cs.discrepancy_reason,
        total_sales_cash: Number(cs.total_sales_cash || 0),
        total_sales_momo: Number(cs.total_sales_momo || 0),
        total_expenses: Number(cs.total_expenses || 0),
        total_drops: Number(cs.total_drops || 0),
        status: cs.status as any,
        opened_at: cs.opened_at,
        closed_at: cs.closed_at,
      };
    });

    const expenses: Expense[] = (expData || []).map((ex: any) => {
      const st = stores.find((s) => s.id === ex.store_id);
      return {
        id: ex.id,
        company_id: ex.company_id,
        store_id: ex.store_id,
        store_name: st ? st.name : 'Toutes les boutiques',
        category_name: ex.category || 'AUTRE',
        created_by_name: 'Comptabilité',
        expense_code: ex.expense_code,
        amount: Number(ex.amount || 0),
        payment_method: ex.payment_method || 'CASH',
        description: ex.description,
        expense_date: ex.expense_date || new Date().toISOString().split('T')[0],
        created_at: ex.created_at,
      };
    });

    const notifications: NotificationItem[] = (notifData || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type as any,
      is_read: n.is_read ?? false,
      created_at: n.created_at,
    }));

    const auditLogs: AuditLog[] = (auditData || []).map((a: any) => ({
      id: a.id,
      store_id: a.store_id,
      user_name: a.user_name || 'Système',
      action: a.action,
      entity_type: a.entity_type,
      details: a.details || '',
      created_at: a.created_at,
    }));

    return {
      company,
      stores,
      users,
      categories,
      suppliers,
      products,
      customers,
      sales,
      transfers,
      movements,
      cashSessions,
      expenses,
      notifications,
      auditLogs,
    };
  } catch (err) {
    console.error('Failed to fetch full Supabase snapshot:', err);
    return null;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str.trim());
}

/**
 * Persist new sale to Supabase asynchronously with rollback safety and automatic stock deduction
 */
export async function syncSaleToSupabase(sale: Sale, updatedProducts?: Product[]): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const saleId = isValidUuid(sale.id) ? sale.id : crypto.randomUUID();
    const companyId = isValidUuid(sale.company_id) ? sale.company_id : 'a0000000-0000-4000-8000-000000000001';
    const storeId = isValidUuid(sale.store_id) ? sale.store_id : 'b0000000-0000-4000-8000-000000000001';
    
    // Resolve seller ID to a valid UUID
    let sellerId = isValidUuid(sale.seller_id) ? sale.seller_id : null;
    if (!sellerId) {
      // Fallback default seller UUID
      sellerId = 'd0000000-0000-4000-8000-000000000002';
    }

    const customerId = isValidUuid(sale.customer_id) ? sale.customer_id : null;

    const { error: saleErr } = await supabase.from('sales').upsert({
      id: saleId,
      company_id: companyId,
      store_id: storeId,
      seller_id: sellerId,
      customer_id: customerId,
      invoice_number: sale.invoice_number,
      subtotal_amount: sale.subtotal_amount,
      discount_amount: sale.discount_amount,
      tax_amount: sale.tax_amount || 0,
      total_amount: sale.total_amount,
      paid_amount: sale.paid_amount,
      change_returned: sale.change_returned,
      payment_method: sale.payments?.[0]?.payment_method || sale.payment_method || 'CASH',
      status: sale.status || 'COMPLETED',
      notes: sale.notes || null,
      created_at: sale.created_at || new Date().toISOString(),
    }, { onConflict: 'id' });

    if (saleErr) {
      console.warn('Failed to insert sale into Supabase:', saleErr);
    }

    if (sale.items && sale.items.length > 0) {
      // 1. Insert items
      try {
        const itemsPayload = sale.items.map((item) => {
          const prodId = isValidUuid(item.product.id) ? item.product.id : crypto.randomUUID();
          return {
            sale_id: saleId,
            product_id: prodId,
            product_name: item.product.name,
            sku: item.product.sku || '',
            unit: item.product.unit || 'Pièce',
            unit_price: item.unit_price,
            purchase_price: item.product.purchase_price || 0,
            quantity: item.quantity,
            discount_amount: item.discount_amount || 0,
            total_price: item.total_price,
          };
        });
        await supabase.from('sale_items').insert(itemsPayload);
      } catch (itemErr) {
        console.warn('Sale items insert warning:', itemErr);
      }

      // 2. Deduct stock in Supabase product_stocks table for each sold item
      for (const item of sale.items) {
        if (!isValidUuid(item.product.id)) continue;
        try {
          let newQty: number | undefined;
          const matchingProd = updatedProducts?.find((p) => p.id === item.product.id);
          if (matchingProd && matchingProd.stock_by_store && typeof matchingProd.stock_by_store[storeId] === 'number') {
            newQty = matchingProd.stock_by_store[storeId];
          }

          if (newQty === undefined) {
            // Query current stock in Supabase as fallback
            const { data: currentStock } = await supabase
              .from('product_stocks')
              .select('quantity')
              .eq('product_id', item.product.id)
              .eq('store_id', storeId)
              .maybeSingle();
            
            const currentVal = Number(currentStock?.quantity || 0);
            newQty = Math.max(0, currentVal - item.quantity);
          }

          const safeNewQty = Number(newQty.toFixed(3));

          await supabase.from('product_stocks').upsert({
            product_id: item.product.id,
            store_id: storeId,
            quantity: safeNewQty,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'product_id,store_id' });

          // Insert stock movement record in Supabase
          await supabase.from('stock_movements').insert({
            product_id: item.product.id,
            store_id: storeId,
            user_id: sellerId,
            type: 'SALE',
            quantity: -item.quantity,
            previous_quantity: Number((safeNewQty + item.quantity).toFixed(3)),
            new_quantity: safeNewQty,
            reference_number: sale.invoice_number,
            reason: `Vente #${sale.invoice_number} (${item.quantity} ${item.product.unit || 'Pièce'})`,
            created_at: sale.created_at || new Date().toISOString(),
          });
        } catch (stockSyncErr) {
          console.warn('Product stock deduction error for item:', item.product.name, stockSyncErr);
        }
      }
    }

    if (sale.payments && sale.payments.length > 0) {
      try {
        const paymentsPayload = sale.payments.map((p) => ({
          sale_id: saleId,
          method: p.payment_method,
          amount: p.amount,
          reference: p.reference_code || null,
        }));
        await supabase.from('sale_payments').insert(paymentsPayload);
      } catch (payErr) {
        console.warn('Sale payments insert warning:', payErr);
      }
    }

    return true;
  } catch (e) {
    console.warn('Sync sale to Supabase error:', e);
    return false;
  }
}

/**
 * Persist product addition or update to Supabase
 */
export async function syncProductToSupabase(product: Product): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const validProdId = isValidUuid(product.id) ? product.id : crypto.randomUUID();
    const validCompId = isValidUuid(product.company_id) ? product.company_id : 'a0000000-0000-4000-8000-000000000001';
    const validCatId = isValidUuid(product.category_id) ? product.category_id : null;
    const validSupId = isValidUuid(product.supplier_id) ? product.supplier_id : null;

    const normalizedTiers = normalizePriceTiers(product.price_tiers);
    let baseDesc = product.description || '';
    if (baseDesc.includes('[TIERS_META:')) {
      const startIdx = baseDesc.indexOf('[TIERS_META:');
      const endIdx = baseDesc.lastIndexOf(']');
      if (endIdx > startIdx) {
        baseDesc = (baseDesc.substring(0, startIdx) + baseDesc.substring(endIdx + 1)).trim();
      }
    }
    const tiersMetaStr = normalizedTiers.length > 0 ? ` [TIERS_META:${JSON.stringify(normalizedTiers)}]` : '';
    const descWithFallback = (baseDesc + tiersMetaStr).trim();

    // Always send the valid id so Supabase uses it (upsert by id = no duplicate rows)
    const { error: prodErr } = await supabase.from('products').upsert({
      id: validProdId,
      company_id: validCompId,
      category_id: validCatId,
      supplier_id: validSupId,
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      description: descWithFallback || null,
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      promo_price: product.promo_price || null,
      min_stock_alert: product.min_stock_alert,
      unit: product.unit || 'Pièce',
      is_weight_based: product.is_weight_based ?? false,
      is_perishable: product.is_perishable ?? false,
      expiry_date: product.expiry_date || null,
      image_url: product.image_url || null,
      is_active: product.is_active,
      // Extra fields — stored if column exists, silently ignored otherwise
      carton_price: product.carton_price ?? null,
      carton_weight_kg: product.carton_weight_kg ?? null,
      carton_stock: product.carton_stock ?? null,
      price_tiers: normalizedTiers.length > 0 ? normalizedTiers : null,
    }, { onConflict: 'id' });

    if (prodErr) {
      // Retry without extra columns if the DB schema doesn't have them yet (tiers are safely backed up in description)
      const { error: retryErr } = await supabase.from('products').upsert({
        id: validProdId,
        company_id: validCompId,
        category_id: validCatId,
        supplier_id: validSupId,
        sku: product.sku,
        barcode: product.barcode,
        name: product.name,
        description: descWithFallback || null,
        purchase_price: product.purchase_price,
        selling_price: product.selling_price,
        promo_price: product.promo_price || null,
        min_stock_alert: product.min_stock_alert,
        unit: product.unit || 'Pièce',
        is_weight_based: product.is_weight_based ?? false,
        is_perishable: product.is_perishable ?? false,
        expiry_date: product.expiry_date || null,
        image_url: product.image_url || null,
        is_active: product.is_active,
      }, { onConflict: 'id' });

      if (retryErr) {
        console.warn('Failed to upsert product into Supabase:', retryErr);
        return false;
      }
    }

    // Upsert stock per store — always use the valid product id
    if (product.stock_by_store && Object.keys(product.stock_by_store).length > 0) {
      const stockEntries = Object.entries(product.stock_by_store)
        .filter(([storeId]) => isValidUuid(storeId))
        .map(([storeId, qty]) => ({
          product_id: validProdId,
          store_id: storeId,
          quantity: qty,
        }));
      if (stockEntries.length > 0) {
        const { error: stockErr } = await supabase
          .from('product_stocks')
          .upsert(stockEntries, { onConflict: 'product_id,store_id' });
        if (stockErr) {
          console.warn('Failed to upsert product_stocks:', stockErr);
        }
      }
    }

    return true;
  } catch (e) {
    console.warn('Sync product to Supabase error:', e);
    return false;
  }
}

/**
 * Persist expense to Supabase
 */
export async function syncExpenseToSupabase(expense: Expense): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('expenses').insert({
      id: isValidUuid(expense.id) ? expense.id : crypto.randomUUID(),
      company_id: isValidUuid(expense.company_id) ? expense.company_id : 'a0000000-0000-4000-8000-000000000001',
      store_id: isValidUuid(expense.store_id) ? expense.store_id : null,
      expense_code: expense.expense_code,
      amount: expense.amount,
      payment_method: expense.payment_method || 'CASH',
      category: expense.category_name,
      description: expense.description,
      expense_date: expense.expense_date,
      created_at: expense.created_at,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Persist cash session update to Supabase
 */
export async function syncCashSessionToSupabase(session: CashSession): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('cash_sessions').upsert({
      id: isValidUuid(session.id) ? session.id : crypto.randomUUID(),
      store_id: isValidUuid(session.store_id) ? session.store_id : 'b0000000-0000-4000-8000-000000000001',
      user_id: isValidUuid(session.user_id) ? session.user_id : 'd0000000-0000-4000-8000-000000000001',
      session_code: session.session_code,
      opening_balance: session.opening_balance,
      closing_balance_system: session.closing_balance_system,
      closing_balance_real: session.closing_balance_real || null,
      discrepancy: session.discrepancy,
      discrepancy_reason: session.discrepancy_reason || null,
      total_sales_cash: session.total_sales_cash,
      total_sales_momo: session.total_sales_momo,
      total_expenses: session.total_expenses,
      status: session.status,
      opened_at: session.opened_at,
      closed_at: session.closed_at || null,
    });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Persist staff/collaborator account to Supabase
 */
export async function syncStaffToSupabase(user: UserProfile): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const validUserId = isValidUuid(user.id) ? user.id : crypto.randomUUID();
    const validRoleId = isValidUuid(user.role_id)
      ? user.role_id
      : (user.role_code === 'OWNER'
          ? 'c0000000-0000-4000-8000-000000000001'
          : user.role_code === 'MANAGER'
          ? 'c0000000-0000-4000-8000-000000000002'
          : 'c0000000-0000-4000-8000-000000000003');
    const validCompanyId = isValidUuid(user.company_id) ? user.company_id : 'a0000000-0000-4000-8000-000000000001';
    const validStoreId = isValidUuid(user.store_id) ? user.store_id : null;

    const { error } = await supabase.from('users').upsert({
      id: validUserId,
      company_id: validCompanyId,
      store_id: validStoreId,
      role_id: validRoleId,
      code: user.code,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      password_hash: user.password || 'Boutique@2026',
      pin_code: user.pin_code || '1234',
      is_active: user.is_active ?? true,
      monthly_sales_target: user.monthly_sales_target || 1500000,
    }, { onConflict: 'id' });

    if (error) {
      console.warn('Sync staff to Supabase error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Sync staff to Supabase error:', err);
    return false;
  }
}

/**
 * Persist store creation or update to Supabase
 */
export async function syncStoreToSupabase(store: Store): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('stores').upsert({
      id: store.id.startsWith('st-') ? undefined : store.id,
      company_id: store.company_id,
      code: store.code,
      name: store.name,
      address: store.address,
      city: store.city || 'Cotonou',
      phone: store.phone,
      email: store.email,
      manager_name: store.manager_name,
      opening_hours: store.opening_hours || '08h00 - 20h00',
      description: store.description || null,
      is_active: store.is_active ?? true,
    });
    return !error;
  } catch (err) {
    console.warn('Sync store to Supabase error:', err);
    return false;
  }
}

/**
 * Persist stock transfer creation or status update to Supabase
 */
export async function syncTransferToSupabase(transfer: StockTransfer): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('stock_transfers').upsert({
      id: transfer.id.startsWith('tr-') ? undefined : transfer.id,
      company_id: transfer.company_id,
      source_store_id: transfer.source_store_id,
      destination_store_id: transfer.destination_store_id,
      transfer_number: transfer.transfer_number,
      requested_by: transfer.requested_by_name,
      status: transfer.status,
      notes: transfer.notes || null,
      created_at: transfer.created_at,
      updated_at: transfer.updated_at || new Date().toISOString(),
    });
    return !error;
  } catch (err) {
    console.warn('Sync transfer to Supabase error:', err);
    return false;
  }
}

/**
 * Persist stock movement to Supabase
 */
export async function syncStockMovementToSupabase(movement: StockMovement): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('stock_movements').insert({
      id: movement.id.startsWith('mov-') ? undefined : movement.id,
      company_id: movement.company_id,
      store_id: movement.store_id,
      product_id: movement.product_id,
      movement_type: movement.type,
      quantity: movement.quantity,
      previous_stock: movement.previous_quantity,
      new_stock: movement.new_quantity,
      reason: movement.reason,
      created_at: movement.created_at,
    });
    return !error;
  } catch (err) {
    console.warn('Sync movement to Supabase error:', err);
    return false;
  }
}

/**
 * Persist notification to Supabase
 */
export async function syncNotificationToSupabase(notif: NotificationItem): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const validId = isValidUuid(notif.id) ? notif.id : crypto.randomUUID();
    const { error } = await supabase.from('notifications').upsert({
      id: validId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      is_read: notif.is_read,
      created_at: notif.created_at,
    }, { onConflict: 'id' });
    if (error) {
      console.warn('Sync notification to Supabase error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Sync notification to Supabase error:', err);
    return false;
  }
}

/**
 * Delete a notification from Supabase
 */
export async function syncDeleteNotificationFromSupabase(notifId: string): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('notifications').delete().eq('id', notifId);
    return !error;
  } catch (err) {
    console.warn('Sync delete notification error:', err);
    return false;
  }
}

/**
 * Clear all notifications from Supabase
 */
export async function syncClearAllNotificationsFromSupabase(): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return !error;
  } catch (err) {
    console.warn('Sync clear notifications error:', err);
    return false;
  }
}

/**
 * Delete staff / user from Supabase
 */
export async function syncDeleteStaffFromSupabase(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    return !error;
  } catch (err) {
    console.warn('Sync delete staff error:', err);
    return false;
  }
}

/**
 * Delete product from Supabase (cascading all foreign keys: product_stocks, sale_items, stock_transfers, stock_movements, and deleting product)
 */
export async function syncDeleteProductFromSupabase(productId: string): Promise<boolean> {
  const supabase = getSupabase();
  try {
    // 1. Delete associated product stock entries
    await supabase.from('product_stocks').delete().eq('product_id', productId);
    
    // 2. Delete associated stock movements
    await supabase.from('stock_movements').delete().eq('product_id', productId);

    // 3. Delete associated stock transfers referencing this product
    await supabase.from('stock_transfers').delete().eq('product_id', productId);

    // 4. Delete associated sale items referencing this product
    await supabase.from('sale_items').delete().eq('product_id', productId);

    // 5. Delete the product itself
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.warn('Direct product deletion failed, attempting soft-delete:', error);
      // Fallback: Soft-delete so it never appears in catalog queries
      await supabase.from('products').update({ is_active: false }).eq('id', productId);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Sync delete product error:', err);
    try {
      await supabase.from('products').update({ is_active: false }).eq('id', productId);
    } catch {}
    return false;
  }
}

/**
 * Delete store from Supabase (clearing associated relations safely)
 */
export async function syncDeleteStoreFromSupabase(storeId: string): Promise<boolean> {
  const supabase = getSupabase();
  try {
    // 1. Delete associated stock entries for this store
    await supabase.from('product_stocks').delete().eq('store_id', storeId);

    // 2. Delete associated cash registers for this store
    await supabase.from('cash_registers').delete().eq('store_id', storeId);

    // 3. Dissociate users linked to this store
    await supabase.from('users').update({ store_id: null }).eq('store_id', storeId);

    // 4. Delete the store itself
    const { error } = await supabase.from('stores').delete().eq('id', storeId);
    if (error) {
      console.warn('Failed to delete store from Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Sync delete store error:', err);
    return false;
  }
}

/**
 * Persist category creation or update to Supabase
 */
export async function syncCategoryToSupabase(category: Category): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('categories').upsert({
      id: category.id.startsWith('cat-') ? undefined : category.id,
      company_id: category.company_id,
      name: category.name,
      slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
      icon: category.icon || 'Package',
      color: category.color || '#3b82f6',
      description: category.description || null,
    });
    return !error;
  } catch (err) {
    console.warn('Sync category error:', err);
    return false;
  }
}

/**
 * Delete category from Supabase
 */
export async function syncDeleteCategoryFromSupabase(categoryId: string): Promise<boolean> {
  const supabase = getSupabase();
  try {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    return !error;
  } catch (err) {
    console.warn('Sync delete category error:', err);
    return false;
  }
}



