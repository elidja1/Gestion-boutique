'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { UserProfile, UserRoleType } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  Users,
  Plus,
  Search,
  Shield,
  Phone,
  Mail,
  Store,
  Crown,
  Briefcase,
  ShoppingCart,
  Package,
  BadgeDollarSign,
  Target,
  X,
  Trash2,
  Edit2,
  CheckCircle2,
  Power,
} from 'lucide-react';

export const StaffList: React.FC = () => {
  const { state, currentUser, addStaff, updateStaff, deleteStaff } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);

  const [fullName, setFullName] = useState('');
  const [roleCode, setRoleCode] = useState<UserRoleType>('SELLER');
  const [storeId, setStoreId] = useState(state.stores[0]?.id || '');
  const [phone, setPhone] = useState('+229 ');
  const [email, setEmail] = useState('');
  const [target, setTarget] = useState<number>(1500000);
  const [password, setPassword] = useState('Boutique@2026');
  const [confirmPassword, setConfirmPassword] = useState('Boutique@2026');
  const [pinCode, setPinCode] = useState('1234');
  const [isActive, setIsActive] = useState(true);
  const [passwordError, setPasswordError] = useState('');

  const filteredStaff = state.users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
  );

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFullName('');
    setRoleCode('SELLER');
    setStoreId(state.stores[0]?.id || '');
    setPhone('+229 ');
    setEmail('');
    setTarget(1500000);
    setPassword('Boutique@2026');
    setConfirmPassword('Boutique@2026');
    setPinCode('1234');
    setIsActive(true);
    setPasswordError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: UserProfile) => {
    setEditingStaff(staff);
    setFullName(staff.full_name);
    setRoleCode(staff.role_code);
    setStoreId(staff.store_id || state.stores[0]?.id || '');
    setPhone(staff.phone);
    setEmail(staff.email);
    setTarget(staff.monthly_sales_target || 1500000);
    setPassword(staff.password || 'Boutique@2026');
    setConfirmPassword(staff.password || 'Boutique@2026');
    setPinCode(staff.pin_code || '1234');
    setIsActive(staff.is_active ?? true);
    setPasswordError('');
    setIsModalOpen(true);
  };

  const handleToggleActive = (staff: UserProfile) => {
    if (staff.role_code === 'OWNER' || staff.role_code === 'SUPERADMIN') {
      alert('Impossible de désactiver le compte Administrateur Principal.');
      return;
    }
    updateStaff({
      ...staff,
      is_active: !staff.is_active,
    });
  };

  const handleDeleteStaff = (staff: UserProfile) => {
    if (staff.role_code === 'OWNER' || staff.role_code === 'SUPERADMIN') {
      alert('Impossible de supprimer un compte Propriétaire / Administrateur.');
      return;
    }
    if (confirm(`⚠️ ATTENTION : Êtes-vous sûr de vouloir supprimer définitivement le compte collaborateur de « ${staff.full_name} » (${staff.code}) ?`)) {
      deleteStaff(staff.id);
    }
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;
    if (password !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    setPasswordError('');

    let resolvedRoleId = 'c0000000-0000-4000-8000-000000000003';
    switch (roleCode) {
      case 'OWNER':
        resolvedRoleId = 'c0000000-0000-4000-8000-000000000001';
        break;
      case 'MANAGER':
        resolvedRoleId = 'c0000000-0000-4000-8000-000000000002';
        break;
      case 'STOCK_AGENT':
        resolvedRoleId = 'c0000000-0000-4000-8000-000000000004';
        break;
      case 'ACCOUNTANT':
        resolvedRoleId = 'c0000000-0000-4000-8000-000000000005';
        break;
      case 'SELLER':
      default:
        resolvedRoleId = 'c0000000-0000-4000-8000-000000000003';
        break;
    }

    const assignedStore = roleCode === 'OWNER' || roleCode === 'ACCOUNTANT' ? null : (storeId || state.stores[0]?.id || null);

    if (editingStaff) {
      const updated: UserProfile = {
        ...editingStaff,
        company_id: state.company?.id || editingStaff.company_id || 'a0000000-0000-4000-8000-000000000001',
        store_id: assignedStore,
        role_id: resolvedRoleId,
        role_code: roleCode,
        full_name: fullName.trim(),
        email: email.trim() || editingStaff.email,
        phone: phone.trim(),
        password: password,
        pin_code: pinCode.trim(),
        is_active: isActive,
        monthly_sales_target: target,
      };
      updateStaff(updated);
    } else {
      const rolePrefix = roleCode === 'MANAGER' ? 'MGR' : roleCode === 'STOCK_AGENT' ? 'STK' : roleCode === 'ACCOUNTANT' ? 'CPT' : 'VEN';
      const uniqueSuffix = Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 89);
      const generatedCode = `${rolePrefix}-${uniqueSuffix}`;
      const generatedEmail = email.trim() || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}.${uniqueSuffix}@vertudegloire.bj`;

      const newStaff: UserProfile = {
        id: crypto.randomUUID(),
        company_id: state.company?.id || 'a0000000-0000-4000-8000-000000000001',
        store_id: assignedStore,
        role_id: resolvedRoleId,
        role_code: roleCode,
        code: generatedCode,
        full_name: fullName.trim(),
        email: generatedEmail,
        phone: phone.trim(),
        password: password,
        pin_code: pinCode.trim(),
        is_active: isActive,
        monthly_sales_target: target,
        current_month_sales: 0,
        created_at: new Date().toISOString(),
      };
      addStaff(newStaff);
    }

    setIsModalOpen(false);
  };

  const getRoleIcon = (role: UserRoleType) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'MANAGER':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'SELLER':
        return <ShoppingCart className="w-4 h-4 text-emerald-500" />;
      case 'STOCK_AGENT':
        return <Package className="w-4 h-4 text-purple-500" />;
      case 'ACCOUNTANT':
        return <BadgeDollarSign className="w-4 h-4 text-slate-700" />;
      default:
        return <Users className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            👨‍💼 Gestion des Collaborateurs & Accès Sécurisés
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Comptes d'accès, mots de passe, codes PIN de caisse et affectations boutique synchronisés en temps réel
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Créer un Compte Collaborateur</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, matricule ou téléphone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs font-medium text-slate-900 outline-none"
        />
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff) => {
          const store = state.stores.find((s) => s.id === staff.store_id);
          const targetAmount = staff.monthly_sales_target || 1500000;
          const sales = staff.current_month_sales || 0;
          const pct = Math.min(100, Math.round((sales / targetAmount) * 100));

          return (
            <div
              key={staff.id}
              className={`bg-white rounded-3xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                staff.is_active ? 'border-slate-200 hover:shadow-md' : 'border-slate-200 bg-slate-50/70 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                      {staff.full_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">{staff.full_name}</h3>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{staff.code}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-800">
                      {getRoleIcon(staff.role_code)}
                      <span>{staff.role_code}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{staff.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-900">{store?.name || 'Toutes Boutiques (Global)'}</span>
                  </div>
                </div>

                {/* Security Credentials Summary */}
                <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-slate-600 font-medium">PIN Caisse :</span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {staff.pin_code || '1234'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      staff.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {staff.is_active ? 'Actif' : 'Désactivé'}
                  </span>
                </div>
              </div>

              {staff.role_code === 'SELLER' || staff.role_code === 'MANAGER' ? (
                <div className="pt-3 border-t border-slate-100 space-y-1 mt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                      <Target className="w-3 h-3 text-blue-600" /> Objectif :
                    </span>
                    <span className="font-black text-slate-900">{formatCurrency(sales)} / {formatCurrency(targetAmount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold block text-right">{pct}% réalisé</span>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 mt-3">
                  Rôle logistique / comptable sans objectif de vente direct
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-100 mt-3">
                <button
                  onClick={() => handleOpenEdit(staff)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  title="Modifier les identifiants ou le rôle"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {staff.role_code !== 'OWNER' && staff.role_code !== 'SUPERADMIN' && (
                  <>
                    <button
                      onClick={() => handleToggleActive(staff)}
                      className={`p-1.5 rounded-xl transition-colors ${
                        staff.is_active
                          ? 'text-rose-600 hover:bg-rose-50 bg-slate-100'
                          : 'text-emerald-600 hover:bg-emerald-50 bg-slate-100'
                      }`}
                      title={staff.is_active ? 'Désactiver le compte' : 'Activer le compte'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(staff)}
                      title="Supprimer définitivement ce collaborateur"
                      className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold">
                  {editingStaff ? 'Modifier le Collaborateur' : 'Création de Compte Collaborateur'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom & Prénom *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pascaline KOUASSI"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rôle & Permissions *</label>
                  <select
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none"
                  >
                    <option value="SELLER">🛒 Caissier / Vendeur POS</option>
                    <option value="MANAGER">👨‍💼 Gérant de Boutique</option>
                    <option value="STOCK_AGENT">📦 Agent Stock & Logistique</option>
                    <option value="ACCOUNTANT">📊 Comptable Central</option>
                    {editingStaff?.role_code === 'OWNER' && (
                      <option value="OWNER">👑 Propriétaire / PDG</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Boutique Affectée</label>
                  <select
                    disabled={roleCode === 'OWNER' || roleCode === 'ACCOUNTANT'}
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none disabled:opacity-50"
                  >
                    {state.stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Téléphone Contact *</label>
                  <input
                    type="text"
                    required
                    placeholder="+229 97 XX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email professionnel</label>
                  <input
                    type="email"
                    placeholder="email@vertudegloire.bj"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Security & Authentication Credentials Section */}
              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-blue-950 text-xs">Identifiants d'Accès & Sécurité</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Mot de Passe Connexion *</label>
                    <input
                      type="text"
                      required
                      placeholder="Mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-900 font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Code PIN Caisse (4 chiffres) *</label>
                    <input
                      type="text"
                      maxLength={4}
                      required
                      placeholder="1234"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-slate-900 font-mono tracking-widest text-center font-bold outline-none"
                    />
                  </div>
                </div>

                {passwordError && (
                  <p className="text-[11px] text-rose-600 font-semibold">{passwordError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Objectif Mensuel (FCFA)</label>
                  <input
                    type="number"
                    value={target || ''}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600 outline-none"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                    <span>Compte Actif immédiatement</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingStaff ? 'Enregistrer les Modifications' : 'Créer le Compte'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
