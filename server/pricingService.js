/**
 * Reusable Backend Pricing Engine Service
 *
 * Formula:
 * 1. Fuel Required = Distance (KM) * Fuel Consumption Per KM (L/KM)
 * 2. Fuel Cost = Fuel Required * Fuel Price Per Liter (Rs/L)
 * 3. Distance Cost = Distance (KM) * Price Per KM (Rs/KM)
 * 4. Subtotal = Base Price + Distance Cost + Fuel Cost + Service Charge
 * 5. Tax Amount = Subtotal * (Tax Percentage / 100)
 * 6. Final Flight Price = Math.round(Subtotal + Tax Amount)
 */
export function calculateFlightPrice({
  distanceKm,
  basePrice = 1000,
  pricePerKm = 5,
  fuelPricePerLiter = 100,
  fuelConsumptionPerKm = 0.05,
  serviceCharge = 200,
  taxPercentage = 5
}) {
  const distance = Math.max(0, Number(distanceKm) || 0);
  const base = Math.max(0, Number(basePrice) || 0);
  const pPerKm = Math.max(0, Number(pricePerKm) || 0);
  const fPricePerL = Math.max(0, Number(fuelPricePerLiter) || 0);
  const fConsPerKm = Math.max(0, Number(fuelConsumptionPerKm) || 0);
  const sCharge = Math.max(0, Number(serviceCharge) || 0);
  const taxPct = Math.max(0, Number(taxPercentage) || 0);

  // 1. Distance Cost
  const distanceCost = Math.round(distance * pPerKm);

  // 2. Fuel calculation
  const fuelRequiredLiters = parseFloat((distance * fConsPerKm).toFixed(2));
  const fuelCost = Math.round(fuelRequiredLiters * fPricePerL);

  // 3. Subtotal before taxes
  const subtotal = base + distanceCost + fuelCost + sCharge;

  // 4. Tax
  const taxAmount = Math.round(subtotal * (taxPct / 100));

  // 5. Final Flight Price
  const finalPrice = subtotal + taxAmount;

  return {
    distanceKm: distance,
    basePrice: base,
    distanceCost,
    fuelRequiredLiters,
    fuelCost,
    serviceCharge: sCharge,
    taxPercentage: taxPct,
    taxAmount,
    subtotal,
    finalPrice
  };
}
