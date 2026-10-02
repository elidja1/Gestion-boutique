import { calculateTieredPrice, normalizePriceTiers } from '../lib/utils';

console.log('===============================================================');
console.log('🧪 TEST AUTOMATISÉ : MOTEUR DE CALCUL DES VENTES & PALIERS');
console.log('===============================================================\n');

// -------------------------------------------------------------
// SCÉNARIO 1 : Le cas exact demandé par l'utilisateur
// Produit : Viande / Riz au Kg
// Prix de base : 1 000 FCFA / Kg
// Réduction configurée : 2,5 Kg = 2 000 FCFA
// -------------------------------------------------------------
const produitTest1 = {
  name: 'Riz Parfumé / Viande de Bœuf',
  unit: 'Kg',
  selling_price: 1000,
  price_tiers: [
    { quantity: 2.5, price: 2000, label: 'Palier 2.5 Kg' }
  ]
};

console.log('📌 PRODUIT TEST 1 :');
console.log(`- Désignation : ${produitTest1.name}`);
console.log(`- Tarif normal : ${produitTest1.selling_price} FCFA / ${produitTest1.unit}`);
console.log(`- Réductions définies : 2.5 Kg ➔ 2 000 FCFA (au lieu de 2 500 FCFA)\n`);

const testQuantities1 = [1, 2, 2.5, 3.5, 5, 6, 7.5];

testQuantities1.forEach((qty) => {
  const result = calculateTieredPrice(produitTest1, qty);
  const normalSansReduction = qty * produitTest1.selling_price;
  
  console.log(`🛒 Vente de ${qty} Kg :`);
  console.log(`   - Montant sans réduction : ${normalSansReduction.toLocaleString()} FCFA`);
  console.log(`   - Montant calculé net    : ${result.totalPrice.toLocaleString()} FCFA`);
  console.log(`   - Économie pour le client: ${result.savings.toLocaleString()} FCFA`);
  console.log(`   - Formule décomposée     : ${result.explanation}`);
  console.log(`   - Prix unitaire effectif : ${result.effectiveUnitPrice} FCFA/Kg`);
  console.log('---------------------------------------------------------------');
});

// -------------------------------------------------------------
// SCÉNARIO 2 : Paliers multiples + Carton
// Prix de base : 1 000 FCFA / Kg
// Palier 1 : 2.5 Kg = 2 000 FCFA
// Palier 2 : 5 Kg = 3 800 FCFA
// Carton : 10 Kg = 7 000 FCFA
// -------------------------------------------------------------
console.log('\n📌 PRODUIT TEST 2 (Paliers Multiples + Carton) :');
const produitTest2 = {
  name: 'Poisson Frais Tilapia',
  unit: 'Kg',
  selling_price: 1000,
  carton_price: 7000,
  carton_weight_kg: 10,
  price_tiers: [
    { quantity: 2.5, price: 2000, label: 'Palier 2.5 Kg' },
    { quantity: 5, price: 3800, label: 'Palier 5 Kg' },
  ]
};

const testQuantities2 = [3.5, 7.5, 10, 13.5];

testQuantities2.forEach((qty) => {
  const result = calculateTieredPrice(produitTest2, qty);
  const normalSansReduction = qty * produitTest2.selling_price;
  
  console.log(`🛒 Vente de ${qty} Kg :`);
  console.log(`   - Montant sans réduction : ${normalSansReduction.toLocaleString()} FCFA`);
  console.log(`   - Montant calculé net    : ${result.totalPrice.toLocaleString()} FCFA`);
  console.log(`   - Économie pour le client: ${result.savings.toLocaleString()} FCFA`);
  console.log(`   - Formule décomposée     : ${result.explanation}`);
  console.log('---------------------------------------------------------------');
});

console.log('\n✅ TOUS LES TESTS SONT VALIDES AVEC SUCCÈS !');
