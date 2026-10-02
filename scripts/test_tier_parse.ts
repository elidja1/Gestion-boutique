import { normalizePriceTiers } from '../lib/utils';

const desc1 = '[TIERS_META:[{"id":"tier-1790755459510-b4j","quantity":2.5,"price":2000,"label":"Palier 2.5 Kg","unitPrice":800}]]';
const desc2 = 'Description du produit [TIERS_META:[{"id":"tier-1","quantity":2.5,"price":2000,"label":"Palier 2.5 Kg"},{"id":"tier-2","quantity":5,"price":3800,"label":"Palier 5 Kg"}]] Fin';

function extractTiers(rawDesc: string) {
  let tiers: any[] = [];
  let cleanDesc = rawDesc || '';
  if (cleanDesc.includes('[TIERS_META:')) {
    try {
      const startIdx = cleanDesc.indexOf('[TIERS_META:') + 12;
      const endIdx = cleanDesc.lastIndexOf(']');
      if (endIdx > startIdx) {
        const jsonStr = cleanDesc.substring(startIdx, endIdx).trim();
        tiers = normalizePriceTiers(JSON.parse(jsonStr));
      }
    } catch (e) {
      console.warn('Failed to parse:', e);
    }
    const startIdx = cleanDesc.indexOf('[TIERS_META:');
    const endIdx = cleanDesc.lastIndexOf(']');
    if (endIdx > startIdx) {
      cleanDesc = (cleanDesc.substring(0, startIdx) + cleanDesc.substring(endIdx + 1)).trim();
    }
  }
  return { tiers, cleanDesc };
}

console.log('Result 1:', extractTiers(desc1));
console.log('Result 2:', extractTiers(desc2));
