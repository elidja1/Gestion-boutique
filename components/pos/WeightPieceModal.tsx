'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '@/lib/types';
import { formatCurrency, calculateTieredPrice, normalizePriceTiers } from '@/lib/utils';
import { X, Scale, Package, Plus, Minus, Check, Box, Sparkles, Tag } from 'lucide-react';

interface WeightPieceModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product, quantity: number, customUnitPrice?: number) => void;
}

export const WeightPieceModal: React.FC<WeightPieceModalProps> = ({
  isOpen,
  product,
  onClose,
  onConfirm,
}) => {
  const isWeight = product ? (product.unit === 'Kg' || product.unit === 'Gramme' || !!product.is_weight_based) : false;
  const basePrice = product ? (product.promo_price || product.selling_price || 0) : 0;
  const normalizedTiers = useMemo(() => normalizePriceTiers(product?.price_tiers), [product?.price_tiers]);

  // Weight mode state
  const [grams, setGrams] = useState<number>(500);
  const [gramsInputStr, setGramsInputStr] = useState<string>('500');
  const [kg, setKg] = useState<number>(0.5);
  const [kgInputStr, setKgInputStr] = useState<string>('0.5');

  // Piece mode state (supports decimal numbers like 0.2, 0.25, 0.5, 1.5)
  const [pieces, setPieces] = useState<number>(1);
  const [pieceInputStr, setPieceInputStr] = useState<string>('1');

  // Custom carton selection mode
  const [isCartonSelected, setIsCartonSelected] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      if (isWeight) {
        setGrams(500);
        setGramsInputStr('500');
        setKg(0.5);
        setKgInputStr('0.5');
      } else {
        setPieces(1);
        setPieceInputStr('1');
      }
      setIsCartonSelected(false);
    }
  }, [product, isWeight, isOpen]);

  // Current active quantity
  const currentQuantity = isWeight ? kg : pieces;

  // Real-time intelligent tier & remainder calculation
  const tieredResult = useMemo(() => {
    if (!product) return null;
    if (isCartonSelected && product.carton_price) {
      const cartonQty = product.carton_weight_kg || 1;
      return {
        totalPrice: product.carton_price,
        effectiveUnitPrice: Math.round((product.carton_price / cartonQty) * 100) / 100,
        explanation: `1 Carton complet (${cartonQty} ${product.unit})`,
        appliedTiers: [],
        remainderQuantity: 0,
        remainderPrice: 0,
        hasDiscount: true,
        savings: Math.max(0, Math.round(cartonQty * basePrice) - product.carton_price),
      };
    }
    return calculateTieredPrice(product, currentQuantity);
  }, [product, isWeight, currentQuantity, isCartonSelected, basePrice]);

  if (!isOpen || !product || !tieredResult) {
    return null;
  }

  const handleGramsStrChange = (valStr: string) => {
    setGramsInputStr(valStr);
    const cleanStr = valStr.replace(',', '.').trim();
    const num = parseFloat(cleanStr);
    if (!isNaN(num) && num >= 0) {
      setGrams(num);
      const newKg = Math.round((num / 1000) * 1000) / 1000;
      setKg(newKg);
      setKgInputStr(String(newKg));
      setIsCartonSelected(false);
    }
  };

  const handleKgStrChange = (valStr: string) => {
    setKgInputStr(valStr);
    const cleanStr = valStr.replace(',', '.').trim();
    const num = parseFloat(cleanStr);
    if (!isNaN(num) && num >= 0) {
      setKg(num);
      const newGrams = Math.round(num * 1000);
      setGrams(newGrams);
      setGramsInputStr(String(newGrams));
      setIsCartonSelected(false);
    }
  };

  const handlePresetWeight = (presetGrams: number) => {
    const cleanG = Math.max(0, presetGrams);
    const cleanK = Math.round((cleanG / 1000) * 1000) / 1000;
    setGrams(cleanG);
    setGramsInputStr(String(cleanG));
    setKg(cleanK);
    setKgInputStr(String(cleanK));
    setIsCartonSelected(false);
  };

  const handlePieceInputChange = (valStr: string) => {
    setPieceInputStr(valStr);
    const num = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      setPieces(Math.round(num * 1000) / 1000);
      setIsCartonSelected(false);
    }
  };

  const handlePresetPieces = (presetQty: number) => {
    const clean = Math.max(0.01, presetQty);
    setPieces(clean);
    setPieceInputStr(clean.toString());
    setIsCartonSelected(false);
  };

  const handleAdjustPieces = (delta: number) => {
    const step = pieces < 1 ? 0.25 : 1;
    const newQty = Math.max(0.1, Math.round((pieces + delta * step) * 100) / 100);
    setPieces(newQty);
    setPieceInputStr(newQty.toString());
    setIsCartonSelected(false);
  };

  const handleSelectTierDirect = (tierQty: number) => {
    if (isWeight) {
      const cleanK = Math.round(tierQty * 1000) / 1000;
      const cleanG = Math.round(cleanK * 1000);
      setKg(cleanK);
      setKgInputStr(String(cleanK));
      setGrams(cleanG);
      setGramsInputStr(String(cleanG));
    } else {
      setPieces(tierQty);
      setPieceInputStr(tierQty.toString());
    }
    setIsCartonSelected(false);
  };

  const handleSelectCarton = () => {
    if (product.carton_price) {
      const cartonQty = product.carton_weight_kg || 1;
      if (isWeight) {
        setKg(cartonQty);
        setKgInputStr(String(cartonQty));
        setGrams(Math.round(cartonQty * 1000));
        setGramsInputStr(String(Math.round(cartonQty * 1000)));
      } else {
        setPieces(cartonQty);
        setPieceInputStr(cartonQty.toString());
      }
      setIsCartonSelected(true);
    }
  };

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    const finalQty = isWeight ? kg : pieces;
    if (finalQty <= 0) return;
    onConfirm(product, finalQty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            {isWeight ? <Scale className="w-5 h-5 text-blue-400" /> : <Package className="w-5 h-5 text-blue-400" />}
            <div>
              <h3 className="text-sm font-bold text-white">{product.name}</h3>
              <p className="text-xs text-slate-400">
                Tarif de base : <strong className="text-white font-semibold">{formatCurrency(basePrice)}</strong> / {product.unit}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAddToCart} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Quick Carton Option */}
          {product.carton_price && product.carton_price > 0 && (
            <button
              type="button"
              onClick={handleSelectCarton}
              className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between ${
                isCartonSelected
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-purple-50/70 text-purple-900 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <div className="flex items-center gap-2.5 text-left">
                <Box className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="font-black text-xs">📦 Vente Carton Complet</div>
                  <div className="text-[10px] opacity-80">
                    {product.carton_weight_kg ? `${product.carton_weight_kg} Kg` : '1 Carton'}
                  </div>
                </div>
              </div>
              <span className="font-black text-sm">{formatCurrency(product.carton_price)}</span>
            </button>
          )}

          {/* Price Tiers Quick Buttons */}
          {normalizedTiers.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-slate-600 font-bold text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Paliers & Réductions Définis :</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {normalizedTiers.map((tier) => {
                  const isSelected = !isCartonSelected && Math.abs(currentQuantity - tier.quantity) < 0.001;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => handleSelectTierDirect(tier.quantity)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-bold text-[11px]">
                        Palier {tier.quantity} {product.unit}
                      </div>
                      <div className={`font-black text-xs ${isSelected ? 'text-white' : 'text-emerald-600'}`}>
                        {formatCurrency(tier.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isWeight ? (
            /* Mode Poids */
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-slate-600 font-semibold mb-2">
                  Sélection rapide du poids :
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '100 g', g: 100 },
                    { label: '250 g', g: 250 },
                    { label: '500 g', g: 500 },
                    { label: '750 g', g: 750 },
                    { label: '1 Kg', g: 1000 },
                    { label: '1.5 Kg', g: 1500 },
                    { label: '2 Kg', g: 2000 },
                    { label: '3 Kg', g: 3000 },
                    { label: '4 Kg', g: 4000 },
                    { label: '5 Kg', g: 5000 },
                    { label: '7 Kg', g: 7000 },
                    { label: '10 Kg', g: 10000 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handlePresetWeight(preset.g)}
                      className={`py-2 px-1 text-center font-bold rounded-xl border transition-all ${
                        grams === preset.g && !isCartonSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dual input Grams <-> Kg */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Poids en Grammes (g)</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={gramsInputStr}
                      onChange={(e) => handleGramsStrChange(e.target.value)}
                      placeholder="ex: 3500"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                    <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">g</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">Poids en Kilos (Kg)</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={kgInputStr}
                      onChange={(e) => handleKgStrChange(e.target.value)}
                      placeholder="ex: 3.5 ou 2.5"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    />
                    <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">Kg</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Mode Pièce / Quantité (Supporte les décimales : 0.2, 0.25, 0.5, 1.5 etc.) */
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-slate-600 font-semibold mb-2">
                  Quantité ({product.unit}s / Fractions acceptées : 0.2, 0.5, 1.5...) :
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjustPieces(-1)}
                    className="w-11 h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800 font-bold text-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={pieceInputStr}
                    onChange={(e) => handlePieceInputChange(e.target.value)}
                    className="flex-1 py-2.5 text-center text-xl font-black bg-slate-50 border border-slate-200 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />

                  <button
                    type="button"
                    onClick={() => handleAdjustPieces(1)}
                    className="w-11 h-11 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800 font-bold text-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick decimal piece presets */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[
                  { label: '0.2 (⅕)', qty: 0.2 },
                  { label: '0.25 (¼)', qty: 0.25 },
                  { label: '0.5 (½)', qty: 0.5 },
                  { label: '0.75 (¾)', qty: 0.75 },
                  { label: '1', qty: 1 },
                  { label: '1.5', qty: 1.5 },
                  { label: '2', qty: 2 },
                  { label: '3', qty: 3 },
                  { label: '4', qty: 4 },
                  { label: '5', qty: 5 },
                  { label: '7', qty: 7 },
                  { label: '10', qty: 10 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePresetPieces(preset.qty)}
                    className={`py-2 px-1 text-center font-bold rounded-xl border transition-all ${
                      pieces === preset.qty && !isCartonSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subtotal & Intelligent Tier Decomposition Display Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Montant à payer</p>
                <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                  {tieredResult.explanation}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-slate-900 block">
                  {formatCurrency(tieredResult.totalPrice)}
                </span>
                {tieredResult.effectiveUnitPrice !== basePrice && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({formatCurrency(tieredResult.effectiveUnitPrice)} / {product.unit})
                  </span>
                )}
              </div>
            </div>

            {/* Savings / Discount callout if tier reduction applied */}
            {tieredResult.hasDiscount && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-emerald-700 text-[11px] font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Réduction par palier appliquée automatiquement</span>
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 rounded-full">
                  Économie : -{formatCurrency(tieredResult.savings)}
                </span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Ajouter au Panier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
