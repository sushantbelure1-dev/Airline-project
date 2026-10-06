// Client-side fallback storage when running on static deployments (e.g. Vercel) without backend
export const DEFAULT_AIRPORTS = [
  { code: 'JLG', name: 'Jalgaon Airport', city: 'Jalgaon', display: 'Jalgaon (JLG)' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai', display: 'Mumbai (BOM)' },
  { code: 'PNQ', name: 'Pune Airport', city: 'Pune', display: 'Pune (PNQ)' },
  { code: 'NAG', name: 'Dr. Babasaheb Ambedkar Intl', city: 'Nagpur', display: 'Nagpur (NAG)' },
  { code: 'IXU', name: 'Aurangabad (Chhatrapati Sambhajinagar)', city: 'Aurangabad', display: 'Aurangabad (IXU)' },
  { code: 'DEL', name: 'Indira Gandhi Intl', city: 'Delhi', display: 'Delhi (DEL)' },
  { code: 'BLR', name: 'Kempegowda Intl', city: 'Bengaluru', display: 'Bengaluru (BLR)' },
  { code: 'HYD', name: 'Rajiv Gandhi Intl', city: 'Hyderabad', display: 'Hyderabad (HYD)' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose Intl', city: 'Kolkata', display: 'Kolkata (CCU)' },
  { code: 'MAA', name: 'Chennai Intl', city: 'Chennai', display: 'Chennai (MAA)' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel Intl', city: 'Ahmedabad', display: 'Ahmedabad (AMD)' },
  { code: 'GOI', name: 'Manohar Intl (Goa)', city: 'Goa', display: 'Goa (GOI)' }
];

export const DEFAULT_CONFIG = {
  id: 1,
  basePrice: 1000,
  pricePerKm: 5.0,
  fuelPricePerLiter: 100.0,
  fuelConsumptionPerKm: 0.05,
  serviceCharge: 200.0,
  taxPercentage: 5.0,
  co2EmissionFactor: 2.52,
  emissionFactorUnit: 'kg CO2/L',
  highDemandOccupancyThreshold: 75.0,
  lowDemandOccupancyThreshold: 40.0,
  surgeAdjustmentPercent: 12.0,
  discountAdjustmentPercent: 10.0,
  minHistoricalBookingsRequired: 3
};

const INITIAL_DEMO_USERS = [
  {
    id: 1,
    name: 'Jalgaon Airline Chief Admin',
    email: 'admin@jalgaon.aero',
    password: 'Admin@12345',
    role: 'ADMIN',
    createdAt: '2026-10-01 00:00:00'
  },
  {
    id: 2,
    name: 'Passenger Demo',
    email: 'passenger@example.com',
    password: 'User@12345',
    role: 'USER',
    createdAt: '2026-10-01 00:00:00'
  }
];

const INITIAL_DEMO_FLIGHTS = [
  {
    id: 1,
    flightNumber: 'JA-101',
    airline: 'Jalgaon Airline',
    aircraft: 'ATR 72-600',
    source: 'Jalgaon (JLG)',
    destination: 'Mumbai (BOM)',
    departureDate: '2026-10-08',
    departureTime: '08:00',
    arrivalDate: '2026-10-08',
    arrivalTime: '09:15',
    totalSeats: 72,
    availableSeats: 68,
    distance: 384,
    basePrice: 1000,
    fuelPricePerLiter: 100,
    fuelConsumptionPerKm: 0.05,
    pricePerKm: 5,
    serviceCharge: 200,
    taxPercentage: 5,
    calculatedPrice: 5292,
    status: 'Scheduled',
    fuelConsumedLiters: 19.2,
    totalEstimatedCo2Kg: 48.38,
    carbonMetrics: {
      fuelConsumedLiters: 19.2,
      totalCo2Kg: 48.38,
      co2PerPaxKg: 0.67,
      rating: 'A+'
    }
  },
  {
    id: 2,
    flightNumber: 'JA-205',
    airline: 'Jalgaon Airline',
    aircraft: 'Airbus A320neo',
    source: 'Jalgaon (JLG)',
    destination: 'Delhi (DEL)',
    departureDate: '2026-10-09',
    departureTime: '11:30',
    arrivalDate: '2026-10-09',
    arrivalTime: '13:45',
    totalSeats: 180,
    availableSeats: 142,
    distance: 980,
    basePrice: 1000,
    fuelPricePerLiter: 100,
    fuelConsumptionPerKm: 0.05,
    pricePerKm: 5,
    serviceCharge: 200,
    taxPercentage: 5,
    calculatedPrice: 11550,
    status: 'Scheduled',
    fuelConsumedLiters: 49.0,
    totalEstimatedCo2Kg: 123.48,
    carbonMetrics: {
      fuelConsumedLiters: 49.0,
      totalCo2Kg: 123.48,
      co2PerPaxKg: 0.69,
      rating: 'A'
    }
  },
  {
    id: 3,
    flightNumber: 'JA-310',
    airline: 'Jalgaon Airline',
    aircraft: 'ATR 72-600',
    source: 'Pune (PNQ)',
    destination: 'Hyderabad (HYD)',
    departureDate: '2026-10-06',
    departureTime: '14:00',
    arrivalDate: '2026-10-06',
    arrivalTime: '15:20',
    totalSeats: 72,
    availableSeats: 55,
    distance: 540,
    basePrice: 1000,
    fuelPricePerLiter: 100,
    fuelConsumptionPerKm: 0.05,
    pricePerKm: 5,
    serviceCharge: 200,
    taxPercentage: 5,
    calculatedPrice: 6930,
    status: 'Scheduled',
    fuelConsumedLiters: 27.0,
    totalEstimatedCo2Kg: 68.04,
    carbonMetrics: {
      fuelConsumedLiters: 27.0,
      totalCo2Kg: 68.04,
      co2PerPaxKg: 0.95,
      rating: 'B+'
    }
  }
];

const INITIAL_DEMO_CREW = [
  { id: 1, employeeId: 'PLT-101', name: 'Capt. Rajesh Sharma', role: 'Captain', gender: 'Male', phone: '+91 98220 11223', email: 'rajesh.sharma@jalgaon.aero', status: 'Active' },
  { id: 2, employeeId: 'PLT-102', name: 'Capt. Ananya Verma', role: 'Captain', gender: 'Female', phone: '+91 98220 33445', email: 'ananya.verma@jalgaon.aero', status: 'Active' },
  { id: 3, employeeId: 'PLT-201', name: 'First Officer Vikram Patil', role: 'First Officer', gender: 'Male', phone: '+91 98220 55667', email: 'vikram.patil@jalgaon.aero', status: 'Active' },
  { id: 4, employeeId: 'CRW-301', name: 'Priya Deshmukh', role: 'Cabin Crew Lead', gender: 'Female', phone: '+91 98220 77889', email: 'priya.deshmukh@jalgaon.aero', status: 'Active' },
  { id: 5, employeeId: 'CRW-302', name: 'Sneha Kulkarni', role: 'Cabin Crew', gender: 'Female', phone: '+91 98220 88990', email: 'sneha.kulkarni@jalgaon.aero', status: 'Active' },
  { id: 6, employeeId: 'CRW-303', name: 'Pooja Joshi', role: 'Cabin Crew', gender: 'Female', phone: '+91 98220 99001', email: 'pooja.joshi@jalgaon.aero', status: 'Active' },
  { id: 7, employeeId: 'CRW-304', name: 'Meera Patel', role: 'Cabin Crew', gender: 'Female', phone: '+91 98220 12345', email: 'meera.patel@jalgaon.aero', status: 'Active' },
  { id: 8, employeeId: 'CRW-305', name: 'Riya Shinde', role: 'Cabin Crew', gender: 'Female', phone: '+91 98220 23456', email: 'riya.shinde@jalgaon.aero', status: 'Active' }
];

const INITIAL_DEMO_ASSIGNMENTS = [
  { id: 1, flightId: 1, crewId: 1, assignedRole: 'Captain' },
  { id: 2, flightId: 1, crewId: 4, assignedRole: 'Cabin Crew Lead' },
  { id: 3, flightId: 1, crewId: 5, assignedRole: 'Cabin Crew' },
  { id: 4, flightId: 2, crewId: 2, assignedRole: 'Captain' },
  { id: 5, flightId: 2, crewId: 3, assignedRole: 'First Officer' },
  { id: 6, flightId: 2, crewId: 6, assignedRole: 'Cabin Crew' },
  { id: 7, flightId: 2, crewId: 7, assignedRole: 'Cabin Crew' }
];

const INITIAL_DEMO_WEATHER = [
  { id: 1, airportCode: 'JLG', city: 'Jalgaon Airport', tempCelsius: 31.5, condition: 'Clear Sky', windSpeedKnots: 8.2, windDirection: 'WSW', visibilityMeters: 10000, pressureHpa: 1013.2, safetyStatus: 'SAFE_TO_FLY' },
  { id: 2, airportCode: 'BOM', city: 'Mumbai International', tempCelsius: 29.0, condition: 'Scattered Clouds', windSpeedKnots: 14.5, windDirection: 'SW', visibilityMeters: 8000, pressureHpa: 1011.8, safetyStatus: 'SAFE_TO_FLY' },
  { id: 3, airportCode: 'DEL', city: 'Delhi IGI Airport', tempCelsius: 24.2, condition: 'Dense Fog', windSpeedKnots: 5.0, windDirection: 'NW', visibilityMeters: 1200, pressureHpa: 1016.5, safetyStatus: 'DELAYED_DENSE_FOG' },
  { id: 4, airportCode: 'PNQ', city: 'Pune Airport', tempCelsius: 27.8, condition: 'Clear Sky', windSpeedKnots: 9.0, windDirection: 'WNW', visibilityMeters: 9500, pressureHpa: 1014.0, safetyStatus: 'SAFE_TO_FLY' },
  { id: 5, airportCode: 'HYD', city: 'Hyderabad Rajiv Gandhi', tempCelsius: 30.1, condition: 'Clear Sky', windSpeedKnots: 11.2, windDirection: 'SE', visibilityMeters: 10000, pressureHpa: 1012.0, safetyStatus: 'SAFE_TO_FLY' },
  { id: 6, airportCode: 'GOI', city: 'Goa Dabolim Airport', tempCelsius: 32.0, condition: 'Thunderstorm', windSpeedKnots: 28.4, windDirection: 'SSW', visibilityMeters: 3500, pressureHpa: 1008.2, safetyStatus: 'REROUTE_THUNDERSTORM' },
  { id: 7, airportCode: 'BLR', city: 'Kempegowda Bengaluru', tempCelsius: 26.4, condition: 'Scattered Clouds', windSpeedKnots: 12.0, windDirection: 'E', visibilityMeters: 9000, pressureHpa: 1015.1, safetyStatus: 'SAFE_TO_FLY' }
];

class MockStore {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem('jalgaon_mock_users')) {
      localStorage.setItem('jalgaon_mock_users', JSON.stringify(INITIAL_DEMO_USERS));
    }
    if (!localStorage.getItem('jalgaon_mock_flights')) {
      localStorage.setItem('jalgaon_mock_flights', JSON.stringify(INITIAL_DEMO_FLIGHTS));
    }
    if (!localStorage.getItem('jalgaon_mock_bookings')) {
      localStorage.setItem('jalgaon_mock_bookings', JSON.stringify([]));
    }
    if (!localStorage.getItem('jalgaon_mock_tickets')) {
      localStorage.setItem('jalgaon_mock_tickets', JSON.stringify([]));
    }
    if (!localStorage.getItem('jalgaon_mock_config')) {
      localStorage.setItem('jalgaon_mock_config', JSON.stringify(DEFAULT_CONFIG));
    }
    if (!localStorage.getItem('jalgaon_mock_crew')) {
      localStorage.setItem('jalgaon_mock_crew', JSON.stringify(INITIAL_DEMO_CREW));
    }
    if (!localStorage.getItem('jalgaon_mock_crew_assignments')) {
      localStorage.setItem('jalgaon_mock_crew_assignments', JSON.stringify(INITIAL_DEMO_ASSIGNMENTS));
    }
    if (!localStorage.getItem('jalgaon_mock_weather')) {
      localStorage.setItem('jalgaon_mock_weather', JSON.stringify(INITIAL_DEMO_WEATHER));
    }
  }

  getWeather() {
    return JSON.parse(localStorage.getItem('jalgaon_mock_weather') || JSON.stringify(INITIAL_DEMO_WEATHER));
  }
  setWeather(weather) {
    localStorage.setItem('jalgaon_mock_weather', JSON.stringify(weather));
  }

  getUsers() {
    return JSON.parse(localStorage.getItem('jalgaon_mock_users') || '[]');
  }
  setUsers(users) {
    localStorage.setItem('jalgaon_mock_users', JSON.stringify(users));
  }

  getFlights() {
    return JSON.parse(localStorage.getItem('jalgaon_mock_flights') || '[]');
  }
  setFlights(flights) {
    localStorage.setItem('jalgaon_mock_flights', JSON.stringify(flights));
  }

  getBookings() {
    return JSON.parse(localStorage.getItem('jalgaon_mock_bookings') || '[]');
  }
  setBookings(bookings) {
    localStorage.setItem('jalgaon_mock_bookings', JSON.stringify(bookings));
  }

  getTickets() {
    return JSON.parse(localStorage.getItem('jalgaon_mock_tickets') || '[]');
  }
  setTickets(tickets) {
    localStorage.setItem('jalgaon_mock_tickets', JSON.stringify(tickets));
  }

  getConfig() {
    return JSON.parse(localStorage.getItem('jalgaon_mock_config') || JSON.stringify(DEFAULT_CONFIG));
  }
  setConfig(config) {
    localStorage.setItem('jalgaon_mock_config', JSON.stringify(config));
  }

  getCrew() {
    return JSON.parse(localStorage.getItem('jalgaon_mock_crew') || '[]');
  }
  setCrew(crew) {
    localStorage.setItem('jalgaon_mock_crew', JSON.stringify(crew));
  }

  getCrewAssignments() {
    return JSON.parse(localStorage.getItem('jalgaon_mock_crew_assignments') || '[]');
  }
  setCrewAssignments(assignments) {
    localStorage.setItem('jalgaon_mock_crew_assignments', JSON.stringify(assignments));
  }
}

export const mockStore = new MockStore();

