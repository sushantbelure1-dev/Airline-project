export const INITIAL_FLIGHTS = [
  {
    id: "FL-1082",
    flightNumber: "AI-204",
    origin: "DEL (Delhi)",
    destination: "LHR (London)",
    aircraft: "Boeing 787-9 Dreamliner",
    departureTime: "14:30",
    arrivalTime: "19:15",
    status: "En Route",
    loadFactor: 89, // %
    totalSeats: 296,
    bookedSeats: 263,
    baseFare: 54000,
    currentFare: 69800,
    aiRecommendedFare: 74200,
    predictedDemand: "High (+24%)",
    fuelConsumedKg: 42100,
    safBlendPercent: 18, // Sustainable Aviation Fuel
    co2EmittedTons: 104.2,
    co2PerSeatKg: 396.2,
    carbonOffsetCost: 172900,
    esgRating: "A-",
    turnaroundTimeMin: 45,
    gate: "T3 - G12",
    delayRisk: "Low (8%)",
    aiRouteOptimization: "Jetstream Ride Waypoint B-42 (+3.4% Fuel Saved)"
  },
  {
    id: "FL-2204",
    flightNumber: "AI-101",
    origin: "BOM (Mumbai)",
    destination: "JFK (New York)",
    aircraft: "Airbus A350-900",
    departureTime: "01:45",
    arrivalTime: "07:20",
    status: "Boarding",
    loadFactor: 94,
    totalSeats: 316,
    bookedSeats: 297,
    baseFare: 92800,
    currentFare: 122800,
    aiRecommendedFare: 127800,
    predictedDemand: "Peak (+38%)",
    fuelConsumedKg: 68400,
    safBlendPercent: 25,
    co2EmittedTons: 161.4,
    co2PerSeatKg: 543.4,
    carbonOffsetCost: 267900,
    esgRating: "A+",
    turnaroundTimeMin: 50,
    gate: "T2 - A4",
    delayRisk: "Moderate (22% - Congestion)",
    aiRouteOptimization: "Direct Polar Arc 3 (Avoid headwind -6.1% CO2)"
  },
  {
    id: "FL-3310",
    flightNumber: "AI-312",
    origin: "BLR (Bengaluru)",
    destination: "SIN (Singapore)",
    aircraft: "Airbus A321neo",
    departureTime: "10:15",
    arrivalTime: "17:00",
    status: "Scheduled",
    loadFactor: 76,
    totalSeats: 192,
    bookedSeats: 146,
    baseFare: 26500,
    currentFare: 29800,
    aiRecommendedFare: 27800,
    predictedDemand: "Moderate (-5%)",
    fuelConsumedKg: 14800,
    safBlendPercent: 12,
    co2EmittedTons: 39.8,
    co2PerSeatKg: 272.6,
    carbonOffsetCost: 66000,
    esgRating: "B+",
    turnaroundTimeMin: 35,
    gate: "T1 - Gate 06",
    delayRisk: "Very Low (3%)",
    aiRouteOptimization: "Optimal Altitude Step Climb at FL370"
  },
  {
    id: "FL-4091",
    flightNumber: "AI-509",
    origin: "DEL (Delhi)",
    destination: "DXB (Dubai)",
    aircraft: "Boeing 777-300ER",
    departureTime: "18:00",
    arrivalTime: "20:30",
    status: "Scheduled",
    loadFactor: 82,
    totalSeats: 342,
    bookedSeats: 280,
    baseFare: 34000,
    currentFare: 40600,
    aiRecommendedFare: 43100,
    predictedDemand: "High (+18%)",
    fuelConsumedKg: 21500,
    safBlendPercent: 15,
    co2EmittedTons: 56.7,
    co2PerSeatKg: 202.5,
    carbonOffsetCost: 94100,
    esgRating: "A",
    turnaroundTimeMin: 40,
    gate: "T3 - G24",
    delayRisk: "Low (11%)",
    aiRouteOptimization: "Standard Oceanic Profile"
  },
  {
    id: "FL-5120",
    flightNumber: "AI-780",
    origin: "HYD (Hyderabad)",
    destination: "HND (Tokyo)",
    aircraft: "Boeing 787-8",
    departureTime: "22:10",
    arrivalTime: "09:40",
    status: "Scheduled",
    loadFactor: 68,
    totalSeats: 256,
    bookedSeats: 174,
    baseFare: 64700,
    currentFare: 64700,
    aiRecommendedFare: 59700,
    predictedDemand: "Low (-12% Flash Promo Needed)",
    fuelConsumedKg: 39200,
    safBlendPercent: 10,
    co2EmittedTons: 108.6,
    co2PerSeatKg: 624.1,
    carbonOffsetCost: 180200,
    esgRating: "B",
    turnaroundTimeMin: 55,
    gate: "T1 - B18",
    delayRisk: "Moderate (27% - Weather Front)",
    aiRouteOptimization: "Sub-tropical Jet bypass (-4% Fuel burn)"
  }
];

export const FLEET_METRICS = {
  totalFlightsActive: 142,
  dailyRevenue: 402500000, // ₹40.25 Cr
  avgLoadFactor: 84.6, // %
  rask: 7.40, // Revenue per Available Seat Kilometer (Rs)
  cask: 5.10, // Cost per Available Seat Kilometer (Rs)
  dailyCo2Tons: 14820,
  safAdoptionRate: 16.4, // %
  co2ReductionVsBaseline: 18.2, // %
  aiDynamicRevenueUplift: "+12.4%",
  onTimePerformance: 91.8 // %
};

export const REVENUE_FORECAST_DATA = [
  { day: "Mon", actualRev: 34.0, aiOptimizedRev: 38.2, co2Index: 100 },
  { day: "Tue", actualRev: 32.4, aiOptimizedRev: 37.3, co2Index: 96 },
  { day: "Wed", actualRev: 36.5, aiOptimizedRev: 42.3, co2Index: 94 },
  { day: "Thu", actualRev: 39.8, aiOptimizedRev: 45.6, co2Index: 92 },
  { day: "Fri", actualRev: 46.5, aiOptimizedRev: 53.1, co2Index: 89 },
  { day: "Sat", actualRev: 48.1, aiOptimizedRev: 54.7, co2Index: 88 },
  { day: "Sun", actualRev: 43.1, aiOptimizedRev: 49.8, co2Index: 91 }
];

export const EMISSION_BREAKDOWN = [
  { category: "High Altitude Cruise", share: 64, color: "#38bdf8" },
  { category: "Climb & Acceleration", share: 18, color: "#818cf8" },
  { category: "Taxiing & APU Idle", share: 9, color: "#f59e0b" },
  { category: "Descent & Approach", share: 9, color: "#10b981" }
];
