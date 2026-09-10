// Types & Interfaces for Multi-Shop Boutique Management System (Vertu De Gloire Market)

export type UserRoleType = 'OWNER' | 'MANAGER' | 'SELLER' | 'STOCK_AGENT' | 'ACCOUNTANT';

export interface Company {
  id: string;
  name: string;
  ifu: string;
  rccm: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  currency: string;
  country: string;
  city: string;
  logo_url?: string;
  invoice_footer_message: string;
  tax_rate: number;
  loyalty_rate_amount: number; // e.g. 100 FCFA = 1 pt
  loyalty_point_value: number; // 1 pt = 1 FCFA
}

export interface Store {
  id: string;
  company_id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  manager_name: string;
  opening_hours: string;
  image_url?: string;
  description?: string;
  is_active: boolean;
  employees_count?: number;
  products_count?: number;
  today_sales_count?: number;
  today_revenue?: number;
}

export interface UserProfile {
  id: string;
  auth_id?: string;
  company_id: string;
  store_id?: string | null; // null for Super Admin/Owner
  role_id: string;
  role_code: UserRoleType;
  code: string;
  full_name: string;
  email: string;
  phone: string;
  password?: string; // Mot de passe du compte collaborateur
  pin_code?: string; // Code PIN rapide pour la caisse (ex: 1234)
  avatar_url?: string;
  is_active: boolean;
  monthly_sales_target: number;
  current_month_sales?: number;
  created_at?: string;
}

export interface Category {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description?: string;
  products_count?: number;
}

export interface Supplier {
  id: string;
  company_id: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  total_purchases: number;
  outstanding_balance: number;
}

export type ProductUnitType = 'Pièce' | 'Kg' | 'Gramme' | 'Litre' | 'Paquet' | 'Carton' | 'Mètre' | 'Boîte';

export interface Product {
  id: string;
  company_id: string;
  category_id: string;
  supplier_id?: string;
  name: string;
  sku: string;
  barcode: string;
  description?: string;
  brand?: string;
  unit: ProductUnitType | string; // 'Pièce', 'Kg', 'Litre', etc.
  is_weight_based?: boolean; // true si vendu au poids/volume (ex: 0.5 kg, 1.25 kg)
  is_perishable: boolean; // Produit périssable / conservable ou non
  expiry_date?: string | null; // Date de péremption / DLUO
  purchase_price: number; // Prix d'achat unitaire ou au kg
  selling_price: number; // Prix de vente unitaire ou au kg
  promo_price?: number | null;
  min_stock_alert: number;
  image_url?: string;
  is_active: boolean;
  // Dynamic or joined
  category_name?: string;
  supplier_name?: string;
  stock_by_store?: Record<string, number>; // store_id -> qty (supporte décimales pour kg)
  total_stock?: number;
}

export interface ProductStoreStock {
  id: string;
  product_id: string;
  store_id: string;
  quantity: number;
  min_stock_alert?: number;
  store_selling_price?: number;
}

export interface Customer {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address?: string;
  city: string;
  loyalty_points: number;
  total_spent: number;
  total_orders: number;
  credit_balance: number;
  last_order_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number; // supporte les décimales (ex: 1.5 pour 1.5 Kg)
  unit_price: number; // Prix par unité ou par kg
  discount_amount: number;
  total_price: number;
}

export type PaymentMethod = 'CASH' | 'MTN_MOMO' | 'MOOV_MONEY' | 'WAVE' | 'CARD' | 'CREDIT' | 'SPLIT';

export interface SalePayment {
  payment_method: PaymentMethod;
  amount: number;
  reference_code?: string;
}

export interface Sale {
  id: string;
  company_id: string;
  store_id: string;
  store_name?: string;
  seller_id: string;
  seller_name?: string;
  customer_id?: string | null;
  customer_name?: string;
  customer_phone?: string;
  invoice_number: string;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  change_returned: number;
  payment_status: 'PAID' | 'PARTIAL' | 'CREDIT';
  payment_method: PaymentMethod;
  payments: SalePayment[];
  status: 'COMPLETED' | 'RETURNED' | 'CANCELLED';
  items: CartItem[];
  notes?: string;
  created_at: string;
}

export type TransferStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';

export interface TransferItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity_requested: number;
  quantity_shipped: number;
  quantity_received: number;
  unit?: string;
}

export interface StockTransfer {
  id: string;
  company_id: string;
  transfer_number: string;
  source_store_id: string;
  source_store_name: string;
  destination_store_id: string;
  destination_store_name: string;
  requested_by_name: string;
  approved_by_name?: string;
  received_by_name?: string;
  status: TransferStatus;
  items: TransferItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  company_id: string;
  store_id: string;
  store_name: string;
  product_id: string;
  product_name: string;
  user_name: string;
  type: 'SALE' | 'PURCHASE_ENTRY' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT_POS' | 'ADJUSTMENT_NEG' | 'DAMAGE' | 'RETURN' | 'EXPIRED';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  unit?: string;
  reason: string;
  created_at: string;
}

export interface InventoryItem {
  product_id: string;
  product_name: string;
  sku: string;
  unit?: string;
  system_quantity: number;
  counted_quantity: number;
  discrepancy: number;
  unit_price: number;
  discrepancy_value: number;
  notes?: string;
}

export interface InventorySession {
  id: string;
  store_id: string;
  store_name: string;
  conducted_by_name: string;
  validated_by_name?: string;
  inventory_code: string;
  status: 'IN_PROGRESS' | 'VALIDATED' | 'CANCELLED';
  total_system_items: number;
  total_counted_items: number;
  total_discrepancy_value: number;
  items: InventoryItem[];
  notes?: string;
  created_at: string;
  completed_at?: string;
}

export interface CashSession {
  id: string;
  register_id: string;
  store_id: string;
  store_name: string;
  user_id: string;
  user_name: string;
  session_code: string;
  opening_balance: number;
  closing_balance_system: number;
  closing_balance_real?: number;
  discrepancy?: number;
  discrepancy_reason?: string;
  total_sales_cash: number;
  total_sales_momo: number;
  total_expenses: number;
  total_drops: number;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
  closed_at?: string;
}

export interface Expense {
  id: string;
  company_id: string;
  store_id: string;
  store_name: string;
  category_name: string;
  created_by_name: string;
  expense_code: string;
  amount: number;
  payment_method: string;
  description: string;
  expense_date: string;
  created_at: string;
}

export interface CustomerReview {
  id: string;
  store_id: string;
  store_name: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  store_id?: string;
  title: string;
  message: string;
  type: 'STOCK_RUPTURE' | 'STOCK_LOW' | 'PRODUCT_EXPIRING' | 'BIG_SALE' | 'TRANSFER_REQUEST' | 'CASH_GAP' | 'NEW_EMPLOYEE' | 'GOAL_REACHED' | 'INFO';
  is_read: boolean;
  created_at: string;
  link_url?: string;
}

export interface AuditLog {
  id: string;
  store_id?: string;
  store_name?: string;
  user_name: string;
  action: string;
  entity_type: string;
  details: string;
  created_at: string;
}
