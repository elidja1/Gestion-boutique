-- ==============================================================================
-- 🏪 MULTI-SHOP BOUTIQUE MANAGEMENT SYSTEM (VERTU DE GLOIRE MARKET)
-- SUPABASE POSTGRESQL DATABASE SCHEMA & COMPREHENSIVE SEED DATA
-- Safe & Idempotent: Standard Hex-Only UUIDs (RFC 4122 Compliant)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DROP EXISTING TABLES IN CASCADE ORDER
-- Note: DROP TABLE ... CASCADE automatically deletes all attached RLS policies, foreign keys, and indexes cleanly.
DROP TABLE IF EXISTS public.sale_payments CASCADE;
DROP TABLE IF EXISTS public.sale_items CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.stock_transfers CASCADE;
DROP TABLE IF EXISTS public.product_stocks CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.cash_sessions CASCADE;
DROP TABLE IF EXISTS public.cash_registers CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- ==============================================================================
-- 3. TABLE DEFINITIONS
-- ==============================================================================

-- Table: companies (Informations Légales & Identité)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    ifu VARCHAR(50),
    rccm VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    website VARCHAR(150),
    currency VARCHAR(10) DEFAULT 'FCFA',
    country VARCHAR(100) DEFAULT 'Bénin',
    city VARCHAR(100) DEFAULT 'Cotonou',
    logo_url TEXT,
    invoice_footer_message TEXT DEFAULT 'Merci pour votre confiance et à très bientôt ! Les marchandises vendues ne sont ni reprises ni échangées après 48h.',
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    loyalty_rate_amount NUMERIC(10, 2) DEFAULT 100.00,
    loyalty_point_value NUMERIC(10, 2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: stores (Boutiques Multi-Sites)
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Cotonou',
    phone VARCHAR(50),
    email VARCHAR(100),
    manager_name VARCHAR(150),
    opening_hours VARCHAR(100) DEFAULT '08:00 - 20:30',
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: roles
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: permissions
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT
);

-- Table: role_permissions
CREATE TABLE public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Table: users (Collaborateurs avec Authentification & PIN Caisse)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE RESTRICT,
    code VARCHAR(30) UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(50),
    password_hash TEXT,
    pin_code VARCHAR(10) DEFAULT '1234',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    monthly_sales_target NUMERIC(12, 2) DEFAULT 1500000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150),
    description TEXT,
    color VARCHAR(30) DEFAULT '#2563eb',
    icon VARCHAR(50) DEFAULT 'Package',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: suppliers (Fournisseurs)
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    code VARCHAR(30) UNIQUE,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Cotonou',
    payment_terms VARCHAR(100) DEFAULT 'Comptant',
    balance_payable NUMERIC(14, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: customers (Clients & Fidélité)
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    code VARCHAR(30) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Cotonou',
    loyalty_points INT DEFAULT 0,
    credit_balance NUMERIC(14, 2) DEFAULT 0.00,
    total_spent NUMERIC(14, 2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: products (Articles au Kg, Périssables, DLUO)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL,
    promo_price NUMERIC(12, 2),
    min_stock_alert NUMERIC(10, 3) DEFAULT 5.000,
    unit VARCHAR(30) DEFAULT 'Pièce',
    is_weight_based BOOLEAN DEFAULT FALSE,
    is_perishable BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: product_stocks (Quantités Multi-Boutiques avec Décimales)
CREATE TABLE public.product_stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    location_shelf VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, store_id)
);

-- Table: stock_transfers (Transferts Inter-Boutiques)
CREATE TABLE public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    transfer_number VARCHAR(50) NOT NULL UNIQUE,
    source_store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT,
    dest_store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 3) NOT NULL,
    requested_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    received_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: stock_movements (Traçabilité Mouvements)
CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    previous_quantity NUMERIC(12, 3) NOT NULL,
    new_quantity NUMERIC(12, 3) NOT NULL,
    reference_number VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: sales (Ventes & Encaissements POS)
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE RESTRICT,
    seller_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal_amount NUMERIC(14, 2) NOT NULL,
    discount_amount NUMERIC(14, 2) DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL,
    paid_amount NUMERIC(14, 2) NOT NULL,
    change_returned NUMERIC(14, 2) DEFAULT 0.00,
    payment_status VARCHAR(30) DEFAULT 'PAID',
    payment_method VARCHAR(50) DEFAULT 'CASH',
    status VARCHAR(30) DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: sale_items (Lignes de Vente avec Unités et Quantités Décimales)
CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(50),
    unit VARCHAR(30) DEFAULT 'Pièce',
    unit_price NUMERIC(12, 2) NOT NULL,
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantity NUMERIC(12, 3) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: sale_payments (Multi-Paiements: Espèces, MoMo, Wave, Carte, Crédit)
CREATE TABLE public.sale_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: cash_registers & cash_sessions (Gestion et Clôture de Caisse)
CREATE TABLE public.cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_id UUID REFERENCES public.cash_registers(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    session_code VARCHAR(50) NOT NULL UNIQUE,
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    closing_balance_system NUMERIC(14, 2),
    closing_balance_real NUMERIC(14, 2),
    discrepancy NUMERIC(14, 2) DEFAULT 0.00,
    discrepancy_reason TEXT,
    total_sales_cash NUMERIC(14, 2) DEFAULT 0.00,
    total_sales_momo NUMERIC(14, 2) DEFAULT 0.00,
    total_expenses NUMERIC(14, 2) DEFAULT 0.00,
    total_drops NUMERIC(14, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'OPEN',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Table: expenses (Dépenses & Charges d'Exploitation)
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    expense_code VARCHAR(50) NOT NULL UNIQUE,
    amount NUMERIC(14, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    category VARCHAR(100) DEFAULT 'AUTRE',
    description TEXT NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: notifications & audit_logs
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    user_name VARCHAR(150),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access on companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on roles" ON public.roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on permissions" ON public.permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on role_permissions" ON public.role_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on product_stocks" ON public.product_stocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on stock_transfers" ON public.stock_transfers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on stock_movements" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on sale_items" ON public.sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on sale_payments" ON public.sale_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on cash_registers" ON public.cash_registers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on cash_sessions" ON public.cash_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. REALISTIC PRODUCTION SEED DATA (VERTU DE GLOIRE MARKET BÉNIN)
-- ==============================================================================

-- 5.1 Entreprise
INSERT INTO public.companies (id, name, ifu, rccm, phone, email, address, website, currency, country, city, tax_rate)
VALUES (
    'a0000000-0000-4000-8000-000000000001',
    'Vertu De Gloire Market SARL',
    '0202314589712',
    'RB/COT/23 B 34567',
    '+229 97 00 11 22',
    'direction@vertudegloire.bj',
    'Boulevard de la Marina, Immeuble Horizon 3ème étage',
    'https://vertudegloire.bj',
    'FCFA',
    'Bénin',
    'Cotonou',
    0.00
);

-- 5.2 Boutiques Réelles
INSERT INTO public.stores (id, company_id, code, name, address, city, phone, email, manager_name, opening_hours)
VALUES 
(
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'BOUTIQUE-01',
    'Boutique Ganhi - Siège Central',
    'Carrefour des Trois Banques, Ganhi, Avenue Clozel',
    'Cotonou',
    '+229 97 10 20 30',
    'ganhi@vertudegloire.bj',
    'Aubin DOSSOU',
    '08:00 - 20:30'
),
(
    'b0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'BOUTIQUE-02',
    'Boutique Akpakpa - Zone Commerciale',
    'Avenue du Cinquantenaire, PK3, Face Station Bénin Pétro',
    'Cotonou',
    '+229 96 40 50 60',
    'akpakpa@vertudegloire.bj',
    'Pascaline KOUASSI',
    '08:00 - 21:00'
),
(
    'b0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'BOUTIQUE-03',
    'Boutique Calavi - Arconville',
    'Carrefour IITA, Ruelle Pharmacie Arconville',
    'Abomey-Calavi',
    '+229 95 70 80 90',
    'calavi@vertudegloire.bj',
    'Éric HOUNGBO',
    '08:30 - 20:30'
);

-- 5.3 Rôles
INSERT INTO public.roles (id, name, display_name, description, level)
VALUES 
('c0000000-0000-4000-8000-000000000001', 'OWNER', 'Propriétaire & PDG', 'Accès total à toutes les boutiques et finances', 10),
('c0000000-0000-4000-8000-000000000002', 'MANAGER', 'Gérant de Boutique', 'Gestion du personnel, stock local et caisse', 5),
('c0000000-0000-4000-8000-000000000003', 'SELLER', 'Caissier / Vendeur', 'Vente au comptoir POS et encaissement', 2),
('c0000000-0000-4000-8000-000000000004', 'STOCK_AGENT', 'Agent Logistique & Stock', 'Réceptions commandes et transferts', 3),
('c0000000-0000-4000-8000-000000000005', 'ACCOUNTANT', 'Comptable Central', 'Suivi des bilans, dépenses et trésorerie', 6);

-- 5.4 Collaborateurs avec Mots de passe et Codes PIN Caisse
INSERT INTO public.users (id, company_id, store_id, role_id, code, full_name, email, phone, password_hash, pin_code, monthly_sales_target)
VALUES 
(
    'd0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    NULL,
    'c0000000-0000-4000-8000-000000000001',
    'ADMIN-01',
    'Koffi MENSAH (PDG)',
    'direction@vertudegloire.bj',
    '+229 97 00 11 22',
    'Boutique@2026',
    '2026',
    10000000.00
),
(
    'd0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    'MGR-01',
    'Aubin DOSSOU',
    'aubin.dossou@vertudegloire.bj',
    '+229 97 10 20 30',
    'Boutique@2026',
    '1234',
    4000000.00
),
(
    'd0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000003',
    'VEN-01',
    'Clarisse AGBANGLA',
    'clarisse.agbangla@vertudegloire.bj',
    '+229 66 12 34 56',
    'Boutique@2026',
    '1122',
    2500000.00
),
(
    'd0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000003',
    'VEN-02',
    'Roland HOUESSOU',
    'roland.houessou@vertudegloire.bj',
    '+229 67 89 01 23',
    'Boutique@2026',
    '3344',
    2000000.00
),
(
    'd0000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000003',
    'c0000000-0000-4000-8000-000000000003',
    'VEN-03',
    'Béatrice DATO',
    'beatrice.dato@vertudegloire.bj',
    '+229 94 56 78 90',
    'Boutique@2026',
    '5566',
    1800000.00
);

-- 5.5 Catégories
INSERT INTO public.categories (id, company_id, name, slug, color, icon)
VALUES 
('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Alimentation & Épicerie', 'alimentation-epicerie', '#2563eb', 'Utensils'),
('e0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Boissons & Jus', 'boissons-jus', '#06b6d4', 'Coffee'),
('e0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Produits Frais & Boucherie', 'produits-frais', '#10b981', 'Apple'),
('e0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Cosmétiques & Soins', 'cosmetiques-soins', '#ec4899', 'Sparkles'),
('e0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Hygiène & Entretien', 'hygiene-entretien', '#8b5cf6', 'ShieldCheck'),
('e0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'Textile & Pagnes', 'textile-pagnes', '#f59e0b', 'Tag');

-- 5.6 Fournisseurs
INSERT INTO public.suppliers (id, company_id, code, name, contact_person, phone, email, city, payment_terms)
VALUES 
('f0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'FOURN-01', 'SODECO Bénin Distribution', 'M. TOSSOU', '+229 97 88 77 66', 'commandes@sodeco.bj', 'Cotonou', 'Comptant'),
('f0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'FOURN-02', 'SOBEBRA Brasserie du Bénin', 'Mme ALAPINI', '+229 96 33 22 11', 'ventes@sobebra.bj', 'Cotonou', 'Fin de mois (30j)'),
('f0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'FOURN-03', 'Ferme Pastorale & Abattoir d''Allada', 'Dr BIO', '+229 95 44 55 66', 'abattoir@allada.bj', 'Allada', 'Comptant à livraison'),
('f0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'FOURN-04', 'Grossiste Cosmétique & Beauté Ganhi', 'Mme KPATINVOH', '+229 97 12 90 88', 'contact@beaute-ganhi.bj', 'Cotonou', 'Comptant');

-- 5.7 Clients Réels
INSERT INTO public.customers (id, company_id, code, first_name, last_name, phone, email, city, loyalty_points, credit_balance, total_spent)
VALUES 
('a1000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'CL-001', 'Sévérin', 'ADJIBO', '+229 97 45 12 78', 'adjibo.severin@gmail.com', 'Cotonou', 145, 0.00, 320000.00),
('a1000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'CL-002', 'Victoire', 'KODJIA', '+229 96 89 23 45', 'victoire.kodjia@yahoo.fr', 'Cotonou', 320, 15000.00, 890000.00),
('a1000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'CL-003', 'Dr Gérald', 'SOSSOU', '+229 95 11 44 77', 'gerald.sossou@clinique.bj', 'Abomey-Calavi', 510, 0.00, 1450000.00);

-- 5.8 Produits Réels (Pièce, Kg, Périssables, DLUO)
INSERT INTO public.products (id, company_id, category_id, supplier_id, sku, barcode, name, description, purchase_price, selling_price, promo_price, min_stock_alert, unit, is_weight_based, is_perishable, expiry_date)
VALUES 
(
    'b1000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000001',
    'RIZ-JAS-5K',
    '6181100123456',
    'Riz Parfumé Jasmin Royal Sac 5kg',
    'Riz blanc de qualité supérieure importé de Thaïlande',
    4200.00,
    5500.00,
    5200.00,
    10.000,
    'Pièce',
    FALSE,
    FALSE,
    NULL
),
(
    'b1000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000001',
    'RIZ-VRAC-KG',
    '6181100123457',
    'Riz blanc Parfumé en vrac (au Kg)',
    'Riz parfumé au détail vendu au kilogramme ou fraction de kg',
    800.00,
    1100.00,
    NULL,
    25.000,
    'Kg',
    TRUE,
    FALSE,
    NULL
),
(
    'b1000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000003',
    'f0000000-0000-4000-8000-000000000003',
    'BOEUF-FR-KG',
    '6181100123458',
    'Viande de Bœuf fraîche locale (au Kg)',
    'Viande de bœuf fraîche sans os, découpe du jour, conservation réfrigérée',
    2800.00,
    3600.00,
    NULL,
    15.000,
    'Kg',
    TRUE,
    TRUE,
    '2026-09-18'
),
(
    'b1000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000001',
    'HUILE-DIN-1L',
    '6181100123459',
    'Huile Végétale Raffinée Dinor Bouteille 1L',
    'Huile de palme raffinée enrichie en vitamine A',
    1100.00,
    1400.00,
    1350.00,
    12.000,
    'Pièce',
    FALSE,
    FALSE,
    NULL
),
(
    'b1000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000002',
    'f0000000-0000-4000-8000-000000000002',
    'JUS-ALLADA-33',
    '6181100123460',
    'Pur Jus d''Ananas Pain de Sucre d''Allada 33cl',
    'Jus 100% naturel sans sucre ajouté produit au Bénin',
    350.00,
    600.00,
    NULL,
    20.000,
    'Pièce',
    FALSE,
    TRUE,
    '2026-11-30'
),
(
    'b1000000-0000-4000-8000-000000000006',
    'a0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000004',
    'f0000000-0000-4000-8000-000000000004',
    'SAVON-NOIR-AF',
    '6181100123461',
    'Savon Noir Traditionnel Gommant 250g',
    'Savon artisanal purifiant pour la peau aux huiles végétales',
    1200.00,
    2000.00,
    1800.00,
    8.000,
    'Pièce',
    FALSE,
    FALSE,
    NULL
),
(
    'b1000000-0000-4000-8000-000000000007',
    'a0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000003',
    'f0000000-0000-4000-8000-000000000003',
    'POISSON-CAP-KG',
    '6181100123462',
    'Poisson Capitaine Frais Entier (au Kg)',
    'Poisson frais d''eau douce pêché au lac Nokoué',
    2500.00,
    3400.00,
    NULL,
    10.000,
    'Kg',
    TRUE,
    TRUE,
    '2026-09-14'
),
(
    'b1000000-0000-4000-8000-000000000008',
    'a0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000001',
    'f0000000-0000-4000-8000-000000000001',
    'LAIT-BONNET-400',
    '6181100123463',
    'Lait Évaporé Concentré Bonnet Rouge 400g',
    'Boîte de lait concentré non sucré',
    650.00,
    900.00,
    NULL,
    15.000,
    'Pièce',
    FALSE,
    TRUE,
    '2027-04-15'
),
(
    'b1000000-0000-4000-8000-000000000009',
    'a0000000-0000-4000-8000-000000000001',
    'e0000000-0000-4000-8000-000000000006',
    'f0000000-0000-4000-8000-000000000004',
    'PAGNE-WOODIN-6Y',
    '6181100123464',
    'Pagne Woodin Original Collection Prestige 6 Yards',
    'Tissu pagne 100% coton motifs traditionnels et modernes',
    18000.00,
    25000.00,
    23500.00,
    5.000,
    'Pièce',
    FALSE,
    FALSE,
    NULL
);

-- 5.9 Stocks par Boutique
INSERT INTO public.product_stocks (product_id, store_id, quantity, location_shelf)
VALUES 
-- Riz Jasmin 5kg
('b1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 45.000, 'Rayon Épicerie A1'),
('b1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002', 30.000, 'Rayon Épicerie B2'),
('b1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 18.000, 'Rayon Central C1'),
-- Riz vrac au Kg
('b1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 120.500, 'Bac Vrac A0'),
('b1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 85.000, 'Bac Vrac B0'),
('b1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000003', 60.250, 'Bac Vrac C0'),
-- Viande de bœuf au Kg
('b1000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 35.800, 'Chambre Froide 01'),
('b1000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000002', 22.400, 'Vitrine Boucherie 01'),
('b1000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003', 14.000, 'Vitrine Réfrigérée'),
-- Huile Dinor 1L
('b1000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 60.000, 'Rayon Huiles A3'),
('b1000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 40.000, 'Rayon Huiles B3'),
('b1000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000003', 25.000, 'Rayon Huiles C3'),
-- Jus Ananas 33cl
('b1000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', 96.000, 'Frigo Boissons 01'),
('b1000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000002', 72.000, 'Frigo Boissons 02'),
('b1000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000003', 48.000, 'Frigo Boissons 03'),
-- Savon Noir
('b1000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', 30.000, 'Rayon Beauté A5'),
('b1000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000002', 15.000, 'Rayon Beauté B5'),
('b1000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000003', 10.000, 'Rayon Beauté C5'),
-- Capitaine au Kg
('b1000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000001', 20.000, 'Congélateur Poissons'),
('b1000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000002', 12.500, 'Congélateur Poissons'),
('b1000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000003', 8.000, 'Congélateur Poissons'),
-- Pagne Woodin
('b1000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000001', 12.000, 'Vitrine Textile'),
('b1000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000002', 8.000, 'Vitrine Textile'),
('b1000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000003', 4.000, 'Vitrine Textile');

-- 5.10 Caisses Enregistreuses
INSERT INTO public.cash_registers (id, store_id, name, code)
VALUES 
('c1000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Caisse Principale 01', 'CAISSE-GANHI-01'),
('c1000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'Caisse Principale 01', 'CAISSE-AKPAKPA-01'),
('c1000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003', 'Caisse Principale 01', 'CAISSE-CALAVI-01');

-- 5.11 Session de Caisse Active
INSERT INTO public.cash_sessions (
    id, register_id, store_id, user_id, session_code, opening_balance,
    total_sales_cash, total_sales_momo, total_expenses, status, opened_at
)
VALUES (
    'd1000000-0000-4000-8000-000000000001',
    'c1000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000003',
    'SESS-GANHI-2026-001',
    50000.00,
    185000.00,
    75000.00,
    12000.00,
    'OPEN',
    NOW() - INTERVAL '4 hours'
);

-- 5.12 Ventes Récentes d'Exemple
INSERT INTO public.sales (
    id, company_id, store_id, seller_id, customer_id, invoice_number,
    subtotal_amount, discount_amount, tax_amount, total_amount, paid_amount,
    change_returned, payment_status, payment_method, status, created_at
)
VALUES 
(
    'e1000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000001',
    'FAC-GANHI-004521',
    10700.00,
    700.00,
    0.00,
    10000.00,
    10000.00,
    0.00,
    'PAID',
    'CASH',
    'COMPLETED',
    NOW() - INTERVAL '2 hours'
),
(
    'e1000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'd0000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000002',
    'FAC-GANHI-004522',
    27500.00,
    0.00,
    0.00,
    27500.00,
    27500.00,
    0.00,
    'PAID',
    'MTN_MOMO',
    'COMPLETED',
    NOW() - INTERVAL '1 hour'
);

INSERT INTO public.sale_items (sale_id, product_id, product_name, sku, unit, unit_price, quantity, total_price)
VALUES 
('e1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000001', 'Riz Parfumé Jasmin Royal Sac 5kg', 'RIZ-JAS-5K', 'Pièce', 5200.00, 1.000, 5200.00),
('e1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000003', 'Viande de Bœuf fraîche locale (au Kg)', 'BOEUF-FR-KG', 'Kg', 3600.00, 1.500, 5400.00),
('e1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000009', 'Pagne Woodin Original Collection Prestige 6 Yards', 'PAGNE-WOODIN-6Y', 'Pièce', 25000.00, 1.000, 25000.00),
('e1000000-0000-4000-8000-000000000002', 'b1000000-0000-4000-8000-000000000007', 'Poisson Capitaine Frais Entier (au Kg)', 'POISSON-CAP-KG', 'Kg', 3400.00, 0.735, 2500.00);

-- ==============================================================================
-- 🚀 FIN DU SCRIPT D'INITIALISATION COMPLET, IDEMPOTENT ET COMPATIBLE POSTGRESQL UUID
-- ==============================================================================
