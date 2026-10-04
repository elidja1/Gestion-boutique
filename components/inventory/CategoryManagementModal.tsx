'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Category } from '@/lib/types';
import {
  X,
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Tag,
  Palette,
  Sparkles,
  Utensils,
  Coffee,
  Apple,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#2563eb', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#64748b', // Slate
];

const PRESET_ICONS = [
  'Package',
  'Utensils',
  'Coffee',
  'Apple',
  'Sparkles',
  'ShieldCheck',
  'Tag',
  'Layers',
];

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { state, addCategory, updateCategory, deleteCategory } = useAppStore();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [icon, setIcon] = useState('Package');
  const [description, setDescription] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingCategory(null);
    setName('');
    setColor('#2563eb');
    setIcon('Package');
    setDescription('');
    setIsAddingNew(true);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color || '#2563eb');
    setIcon(cat.icon || 'Package');
    setDescription(cat.description || '');
    setIsAddingNew(true);
  };

  const handleCancelForm = () => {
    setEditingCategory(null);
    setIsAddingNew(false);
    setName('');
    setDescription('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      const updated: Category = {
        ...editingCategory,
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
        color,
        icon,
        description: description.trim() || undefined,
      };
      updateCategory(updated);
    } else {
      const newCat: Category = {
        id: crypto.randomUUID(),
        company_id: state.company?.id || 'a0000000-0000-4000-8000-000000000001',
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
        color,
        icon,
        description: description.trim() || undefined,
        products_count: 0,
      };
      addCategory(newCat);
    }

    handleCancelForm();
  };

  const handleDelete = (cat: Category) => {
    if (state.categories.length <= 1) {
      alert('Impossible de supprimer la dernière catégorie du catalogue.');
      return;
    }
    const productsInCat = state.products.filter((p) => p.category_id === cat.id);
    const countMsg = productsInCat.length > 0 ? `\n\n⚠️ ${productsInCat.length} produit(s) sont actuellement rattachés à ce groupe.` : '';

    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le groupe « ${cat.name} » ?${countMsg}`)) {
      deleteCategory(cat.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold">Gestion des Groupes & Catégories de Produits</h3>
              <p className="text-xs text-slate-400">Organisez vos rayons et filtres de caisse</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Actions */}
          {!isAddingNew && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Groupes Actifs ({state.categories.length})
              </span>
              <button
                type="button"
                onClick={handleStartCreate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Ajouter un Nouveau Groupe</span>
              </button>
            </div>
          )}

          {/* Create / Edit Form */}
          {isAddingNew && (
            <form onSubmit={handleSave} className="p-5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                <span className="font-black text-blue-950 text-sm">
                  {editingCategory ? `Modifier le Groupe : ${editingCategory.name}` : 'Créer un Nouveau Groupe / Catégorie'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Annuler
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom du Groupe / Catégorie *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Produits Laitiers & Fromages, Boissons Fraîches..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Couleur d'identification</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-xl border-2 transition-all ${
                        color === c ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description (Facultatif)</label>
                <input
                  type="text"
                  placeholder="Ex: Rayon frais et produits réfrigérés"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingCategory ? 'Enregistrer les Modifications' : 'Créer le Groupe'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {state.categories.map((cat) => {
              const productCount = state.products.filter((p) => p.category_id === cat.id).length;

              return (
                <div
                  key={cat.id}
                  className="bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 p-4 transition-all shadow-xs flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: cat.color || '#2563eb' }}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-900 truncate text-xs">{cat.name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        {productCount} article(s) associé(s)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                      title="Modifier ce groupe"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      disabled={state.categories.length <= 1}
                      className="p-1.5 text-rose-400 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all"
                      title={state.categories.length <= 1 ? 'Impossible de supprimer le dernier groupe' : 'Supprimer ce groupe'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
