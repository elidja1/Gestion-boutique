// Formatting and utility functions

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

export function formatNumber(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return new Intl.NumberFormat('fr-FR').format(val);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateOnly(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

// Generate short random code
export function generateCode(prefix: string): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${rand}`;
}

// Play POS scanner beep audio via Web Audio API (no external sound file needed)
export function playBeepSound(type: 'success' | 'error' | 'cash' | 'chime' = 'success') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'cash' || type === 'chime') {
      // Pleasant multi-tone cash register chime (C6 -> E6 -> G6)
      const now = ctx.currentTime;
      const notes = [1046.5, 1318.5, 1567.98]; // C6, E6, G6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.error('Audio beep error', e);
  }
}

export interface NormalizedTier {
  id: string;
  quantity: number;
  price: number;
  label?: string;
  unitPrice?: number;
}

/**
 * Safely parses and normalizes price tiers from any format (JSON string, object, array, string numbers)
 */
export function normalizePriceTiers(raw: any): NormalizedTier[] {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) {
    if (typeof parsed === 'object' && parsed !== null) {
      parsed = Object.values(parsed);
    } else {
      return [];
    }
  }

  const result: NormalizedTier[] = [];
  parsed.forEach((item: any, idx: number) => {
    if (!item) return;
    const qtyStr = String(item.quantity ?? '').replace(',', '.').trim();
    const priceStr = String(item.price ?? '').replace(',', '.').trim();
    const qty = Number(qtyStr);
    const price = Number(priceStr);

    if (!isNaN(qty) && qty > 0 && !isNaN(price) && price > 0) {
      const cleanQty = Math.round(qty * 1000) / 1000;
      const cleanPrice = Math.round(price);
      result.push({
        id: item.id || `tier-${idx}-${cleanQty}`,
        quantity: cleanQty,
        price: cleanPrice,
        label: item.label || `Palier ${cleanQty}`,
        unitPrice: Math.round((cleanPrice / cleanQty) * 100) / 100,
      });
    }
  });

  return result;
}

export interface TieredPriceResult {
  totalPrice: number;
  effectiveUnitPrice: number;
  explanation: string;
  appliedTiers: Array<{
    count: number;
    tierQuantity: number;
    tierPrice: number;
    subtotal: number;
    label: string;
  }>;
  remainderQuantity: number;
  remainderPrice: number;
  hasDiscount: boolean;
  savings: number;
}

/**
 * Intelligently calculates tiered prices and bundles reductions with remainder quantities.
 * Example: Base 1,000 F/kg, Tier: 2.5 kg = 2,000 F.
 * For 3.5 kg -> 1 x 2.5kg (2,000 F) + 1kg (1,000 F) = 3,000 F.
 */
export function calculateTieredPrice(
  product: {
    selling_price: number;
    promo_price?: number | null;
    unit: string;
    carton_price?: number | null;
    carton_weight_kg?: number | null;
    price_tiers?: Array<{ quantity: number; price: number; label?: string }> | any;
  },
  quantity: number
): TieredPriceResult {
  const baseUnitPrice = Number(product.promo_price || product.selling_price || 0);
  const cleanQty = Math.round(Math.max(0, Number(quantity) || 0) * 1000) / 1000;
  const unitLabel = product.unit || 'Kg';

  if (cleanQty <= 0) {
    return {
      totalPrice: 0,
      effectiveUnitPrice: baseUnitPrice,
      explanation: '0 FCFA',
      appliedTiers: [],
      remainderQuantity: 0,
      remainderPrice: 0,
      hasDiscount: false,
      savings: 0,
    };
  }

  const normalTotalPrice = Math.round(cleanQty * baseUnitPrice);

  // Normalize all tiers (custom tiers + carton bundle)
  const userTiers = normalizePriceTiers(product.price_tiers);
  const combinedTiers: NormalizedTier[] = [...userTiers];

  const cartonPrice = Number(product.carton_price);
  const cartonWeight = Number(product.carton_weight_kg);

  if (cartonPrice > 0 && cartonWeight > 0) {
    const exists = combinedTiers.some(
      (t) => Math.abs(t.quantity - cartonWeight) < 0.001
    );
    if (!exists) {
      combinedTiers.push({
        id: 'carton-tier',
        quantity: cartonWeight,
        price: cartonPrice,
        label: `Carton complet (${cartonWeight} ${unitLabel})`,
        unitPrice: Math.round((cartonPrice / cartonWeight) * 100) / 100,
      });
    }
  }

  // Sort tiers: largest quantity first (greedy bundle breakdown)
  const tiers = combinedTiers.sort((a, b) => b.quantity - a.quantity);

  if (tiers.length === 0) {
    return {
      totalPrice: normalTotalPrice,
      effectiveUnitPrice: baseUnitPrice,
      explanation: `${cleanQty} ${unitLabel} × ${formatCurrency(baseUnitPrice)}`,
      appliedTiers: [],
      remainderQuantity: cleanQty,
      remainderPrice: normalTotalPrice,
      hasDiscount: false,
      savings: 0,
    };
  }

  let remaining = cleanQty;
  let computedTotal = 0;
  const appliedTiers: TieredPriceResult['appliedTiers'] = [];
  const parts: string[] = [];

  for (const tier of tiers) {
    if (remaining >= tier.quantity - 0.0001) {
      const count = Math.floor((remaining + 0.0001) / tier.quantity);
      if (count > 0) {
        const subtotal = count * tier.price;
        computedTotal += subtotal;
        remaining = Math.round((remaining - count * tier.quantity) * 1000) / 1000;
        const tierName = tier.label || `Palier ${tier.quantity} ${unitLabel}`;
        appliedTiers.push({
          count,
          tierQuantity: tier.quantity,
          tierPrice: tier.price,
          subtotal,
          label: tierName,
        });
        parts.push(
          count === 1
            ? `1 × ${tierName} (${formatCurrency(tier.price)})`
            : `${count} × ${tierName} (${formatCurrency(subtotal)})`
        );
      }
    }
  }

  let remainderPrice = 0;
  if (remaining > 0.0001) {
    remainderPrice = Math.round(remaining * baseUnitPrice);
    computedTotal += remainderPrice;
    parts.push(
      `${remaining} ${unitLabel} × ${formatCurrency(baseUnitPrice)} (${formatCurrency(remainderPrice)})`
    );
  }

  // Ensure computed total never exceeds normal full price
  const finalTotal = Math.min(normalTotalPrice, computedTotal);
  const savings = Math.max(0, normalTotalPrice - finalTotal);
  const effectiveUnitPrice =
    cleanQty > 0 ? Math.round((finalTotal / cleanQty) * 100) / 100 : baseUnitPrice;

  return {
    totalPrice: finalTotal,
    effectiveUnitPrice,
    explanation: parts.join(' + ') || `${cleanQty} ${unitLabel}`,
    appliedTiers,
    remainderQuantity: remaining,
    remainderPrice,
    hasDiscount: savings > 0,
    savings,
  };
}
