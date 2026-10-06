/**
 * Carbon Emission Calculation Engine
 * 
 * Formula:
 * 1. Fuel Consumed (L) = Distance (KM) * Fuel Consumption Per KM (L/KM)
 * 2. Total Estimated Flight CO2 (kg) = Fuel Consumed (L) * CO2 Emission Factor (kg CO2/L)
 * 3. Total Estimated Flight CO2 (Tonnes) = Total Estimated Flight CO2 (kg) / 1000
 * 4. Estimated CO2 Per Passenger (kg/pax) = Total Estimated CO2 (kg) / Max(1, Passenger Count or Total Seats)
 */

export function calculateCarbonEmissions({
  distanceKm,
  fuelConsumptionPerKm = 0.05,
  co2EmissionFactor = 2.52,
  passengerCount = 0,
  totalSeats = 72
}) {
  const dist = Math.max(0, Number(distanceKm) || 0);
  const fuelBurnPerKm = Math.max(0, Number(fuelConsumptionPerKm) || 0);
  const emissionFactor = Math.max(0, Number(co2EmissionFactor) || 2.52);

  // 1. Fuel Consumed
  const fuelConsumedLiters = parseFloat((dist * fuelBurnPerKm).toFixed(2));

  // 2. Flight Level Emissions
  const totalCo2Kg = parseFloat((fuelConsumedLiters * emissionFactor).toFixed(2));
  const totalCo2Tonnes = parseFloat((totalCo2Kg / 1000).toFixed(3));

  // 3. Per Passenger Allocation (at current load vs total capacity)
  const actualPax = Number(passengerCount) || 0;
  const divisor = actualPax > 0 ? actualPax : Math.max(1, Number(totalSeats) || 1);
  const co2PerPaxKg = parseFloat((totalCo2Kg / divisor).toFixed(1));

  // Equivalent comparison metrics (e.g. Tree offset count, standard car emissions)
  const treesNeededForYear = Math.ceil(totalCo2Kg / 21); // 1 mature tree absorbs ~21 kg CO2/yr

  return {
    fuelConsumedLiters,
    totalCo2Kg,
    totalCo2Tonnes,
    co2PerPaxKg,
    treesNeededForYear,
    isEstimate: true,
    disclaimer: "Estimated value calculated using flight distance, fuel consumption rate and emission factor. Actual emissions may vary based on weather, payload, and flight altitude profile."
  };
}
