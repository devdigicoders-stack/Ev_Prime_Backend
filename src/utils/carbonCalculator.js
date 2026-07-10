// India grid emission factor: 0.82 kg CO2 per kWh
// Petrol car: ~2.31 kg CO2 per liter, ~8.9 kWh per liter equivalent
// 1 tree absorbs ~21.77 kg CO2 per year

const GRID_EMISSION_FACTOR = 0.82;       // kg CO2/kWh (India)
const PETROL_CO2_PER_LITER = 2.31;       // kg CO2/liter
const PETROL_KWH_PER_LITER = 8.9;        // kWh equivalent per liter
const TREE_ABSORPTION_KG_PER_YEAR = 21.77;
const FUEL_SAVED_PER_KWH = 0.3;          // liters saved per kWh

/**
 * Calculate carbon savings for a given energy consumption
 * @param {number} energyKwh - actual energy consumed in kWh
 * @returns {{ carbonSavedKg, treesEquivalent, fuelSavedLiters }}
 */
const calculateCarbon = (energyKwh) => {
  if (!energyKwh || energyKwh <= 0) return { carbonSavedKg: 0, treesEquivalent: 0, fuelSavedLiters: 0 };

  const petrolCo2 = (energyKwh / PETROL_KWH_PER_LITER) * PETROL_CO2_PER_LITER;
  const evCo2 = energyKwh * GRID_EMISSION_FACTOR;
  const carbonSavedKg = parseFloat((petrolCo2 - evCo2).toFixed(4));
  const treesEquivalent = parseFloat((carbonSavedKg / TREE_ABSORPTION_KG_PER_YEAR).toFixed(4));
  const fuelSavedLiters = parseFloat((energyKwh * FUEL_SAVED_PER_KWH).toFixed(4));

  return { carbonSavedKg, treesEquivalent, fuelSavedLiters };
};

module.exports = { calculateCarbon };
