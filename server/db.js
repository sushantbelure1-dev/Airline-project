import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'jalgaon_airline.db'));

// Foreign keys & WAL mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Ensure tables exist with extended AI, operations, and carbon metrics
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER', -- 'ADMIN' or 'USER'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Global & configurable Pricing, Fuel, Carbon and AI Configuration
  CREATE TABLE IF NOT EXISTS pricing_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    basePrice REAL NOT NULL DEFAULT 1000,
    pricePerKm REAL NOT NULL DEFAULT 5,
    fuelPricePerLiter REAL NOT NULL DEFAULT 100,
    fuelConsumptionPerKm REAL NOT NULL DEFAULT 0.05,
    serviceCharge REAL NOT NULL DEFAULT 200,
    taxPercentage REAL NOT NULL DEFAULT 5,
    -- Carbon Emission Configuration
    co2EmissionFactor REAL NOT NULL DEFAULT 2.52, -- kg CO2 per liter of jet fuel
    emissionFactorUnit TEXT NOT NULL DEFAULT 'kg CO2/L',
    -- AI Recommendation Parameters
    highDemandOccupancyThreshold REAL NOT NULL DEFAULT 75.0, -- %
    lowDemandOccupancyThreshold REAL NOT NULL DEFAULT 40.0, -- %
    surgeAdjustmentPercent REAL NOT NULL DEFAULT 12.0, -- %
    discountAdjustmentPercent REAL NOT NULL DEFAULT 10.0, -- %
    minHistoricalBookingsRequired INTEGER NOT NULL DEFAULT 3,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Flights table with Carbon & Status Tracking
  CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flightNumber TEXT UNIQUE NOT NULL,
    airline TEXT NOT NULL,
    aircraft TEXT NOT NULL,
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    departureDate TEXT NOT NULL,
    departureTime TEXT NOT NULL,
    arrivalDate TEXT NOT NULL,
    arrivalTime TEXT NOT NULL,
    totalSeats INTEGER NOT NULL,
    availableSeats INTEGER NOT NULL,
    distance REAL NOT NULL,
    basePrice REAL NOT NULL,
    fuelPricePerLiter REAL NOT NULL,
    fuelConsumptionPerKm REAL NOT NULL,
    pricePerKm REAL NOT NULL,
    serviceCharge REAL NOT NULL,
    taxPercentage REAL NOT NULL,
    calculatedPrice REAL NOT NULL,
    -- Operational Status: 'Scheduled', 'Boarding', 'Departed', 'Arrived', 'Delayed', 'Cancelled', 'ACTIVE', 'INACTIVE'
    status TEXT NOT NULL DEFAULT 'Scheduled',
    -- Environmental & Fuel Telemetry
    fuelConsumedLiters REAL NOT NULL DEFAULT 0,
    totalEstimatedCo2Kg REAL NOT NULL DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Bookings table
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookingId TEXT UNIQUE NOT NULL,
    userId INTEGER NOT NULL,
    flightId INTEGER NOT NULL,
    passengerCount INTEGER NOT NULL,
    pricePerPassenger REAL NOT NULL,
    totalAmount REAL NOT NULL,
    bookingDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'CANCELLED', 'COMPLETED'
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flightId) REFERENCES flights(id) ON DELETE CASCADE
  );

  -- Passengers table
  CREATE TABLE IF NOT EXISTS passengers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookingId TEXT NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    seatNumber TEXT,
    FOREIGN KEY (bookingId) REFERENCES bookings(bookingId) ON DELETE CASCADE
  );

  -- Tickets table
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticketId TEXT UNIQUE NOT NULL,
    bookingId TEXT NOT NULL,
    pnr TEXT UNIQUE NOT NULL,
    passengerDetails TEXT NOT NULL,
    qrCodeData TEXT,
    estimatedCo2PerPaxKg REAL DEFAULT 0,
    issueDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    FOREIGN KEY (bookingId) REFERENCES bookings(bookingId) ON DELETE CASCADE
  );

  -- Crew Members table
  CREATE TABLE IF NOT EXISTS crew_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'Captain', 'First Officer', 'Cabin Crew Lead', 'Cabin Crew'
    gender TEXT NOT NULL DEFAULT 'Female', -- 'Male', 'Female', 'Other'
    phone TEXT,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'On Leave', 'Off-Duty'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Crew Flight Roster Assignments table
  CREATE TABLE IF NOT EXISTS crew_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flightId INTEGER NOT NULL,
    crewId INTEGER NOT NULL,
    assignedRole TEXT, -- 'Captain', 'First Officer', 'Cabin Crew Lead', 'Cabin Crew'
    assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flightId) REFERENCES flights(id) ON DELETE CASCADE,
    FOREIGN KEY (crewId) REFERENCES crew_members(id) ON DELETE CASCADE,
    UNIQUE(flightId, crewId)
  );

  -- Airport Weather Intelligence & Radar table
  CREATE TABLE IF NOT EXISTS airport_weather (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    airportCode TEXT UNIQUE NOT NULL, -- 'JLG', 'BOM', 'DEL', 'PNQ', 'HYD', 'GOI', 'BLR'
    city TEXT NOT NULL,
    tempCelsius REAL NOT NULL DEFAULT 28.0,
    condition TEXT NOT NULL DEFAULT 'Clear Sky', -- 'Clear Sky', 'Scattered Clouds', 'Heavy Rain', 'Dense Fog', 'Thunderstorm'
    windSpeedKnots REAL NOT NULL DEFAULT 8.5,
    windDirection TEXT NOT NULL DEFAULT 'WSW',
    visibilityMeters INTEGER NOT NULL DEFAULT 9000,
    pressureHpa REAL NOT NULL DEFAULT 1012.5,
    safetyStatus TEXT NOT NULL DEFAULT 'SAFE_TO_FLY', -- 'SAFE_TO_FLY', 'CAUTION_HIGH_WINDS', 'DELAYED_DENSE_FOG', 'REROUTE_THUNDERSTORM'
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Check and add missing columns if upgrading an existing DB file
function upgradeColumns() {
  const flightCols = db.prepare("PRAGMA table_info(flights)").all().map(c => c.name);
  if (!flightCols.includes('fuelConsumedLiters')) {
    db.exec("ALTER TABLE flights ADD COLUMN fuelConsumedLiters REAL NOT NULL DEFAULT 0");
  }
  if (!flightCols.includes('totalEstimatedCo2Kg')) {
    db.exec("ALTER TABLE flights ADD COLUMN totalEstimatedCo2Kg REAL NOT NULL DEFAULT 0");
  }

  const ticketCols = db.prepare("PRAGMA table_info(tickets)").all().map(c => c.name);
  if (!ticketCols.includes('estimatedCo2PerPaxKg')) {
    db.exec("ALTER TABLE tickets ADD COLUMN estimatedCo2PerPaxKg REAL DEFAULT 0");
  }

  const configCols = db.prepare("PRAGMA table_info(pricing_config)").all().map(c => c.name);
  if (!configCols.includes('co2EmissionFactor')) {
    db.exec("ALTER TABLE pricing_config ADD COLUMN co2EmissionFactor REAL NOT NULL DEFAULT 2.52");
    db.exec("ALTER TABLE pricing_config ADD COLUMN emissionFactorUnit TEXT NOT NULL DEFAULT 'kg CO2/L'");
    db.exec("ALTER TABLE pricing_config ADD COLUMN highDemandOccupancyThreshold REAL NOT NULL DEFAULT 75.0");
    db.exec("ALTER TABLE pricing_config ADD COLUMN lowDemandOccupancyThreshold REAL NOT NULL DEFAULT 40.0");
    db.exec("ALTER TABLE pricing_config ADD COLUMN surgeAdjustmentPercent REAL NOT NULL DEFAULT 12.0");
    db.exec("ALTER TABLE pricing_config ADD COLUMN discountAdjustmentPercent REAL NOT NULL DEFAULT 10.0");
    db.exec("ALTER TABLE pricing_config ADD COLUMN minHistoricalBookingsRequired INTEGER NOT NULL DEFAULT 3");
  }
}

upgradeColumns();

// Seed initial default config if not present
const configCount = db.prepare('SELECT count(*) as count FROM pricing_config').get().count;
if (configCount === 0) {
  db.prepare(`
    INSERT INTO pricing_config (
      id, basePrice, pricePerKm, fuelPricePerLiter, fuelConsumptionPerKm, serviceCharge, taxPercentage,
      co2EmissionFactor, emissionFactorUnit, highDemandOccupancyThreshold, lowDemandOccupancyThreshold,
      surgeAdjustmentPercent, discountAdjustmentPercent, minHistoricalBookingsRequired
    ) VALUES (1, 1000, 5.0, 100.0, 0.05, 200.0, 5.0, 2.52, 'kg CO2/L', 75.0, 40.0, 12.0, 10.0, 3)
  `).run();
}

// Seed initial Admin if not present
const adminExists = db.prepare("SELECT id FROM users WHERE email = 'admin@jalgaon.aero'").get();
if (!adminExists) {
  const salt = bcrypt.genSaltSync(10);
  const hashedAdminPassword = bcrypt.hashSync('Admin@12345', salt);
  db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, 'ADMIN')
  `).run('Jalgaon Airline Chief Admin', 'admin@jalgaon.aero', hashedAdminPassword);
}

// Seed initial Crew Members if table is empty
const crewCount = db.prepare('SELECT count(*) as count FROM crew_members').get().count;
if (crewCount === 0) {
  const defaultCrew = [
    { empId: 'PLT-101', name: 'Capt. Rajesh Sharma', role: 'Captain', gender: 'Male', phone: '+91 98220 11223', email: 'rajesh.sharma@jalgaon.aero' },
    { empId: 'PLT-102', name: 'Capt. Ananya Verma', role: 'Captain', gender: 'Female', phone: '+91 98220 33445', email: 'ananya.verma@jalgaon.aero' },
    { empId: 'PLT-201', name: 'First Officer Vikram Patil', role: 'First Officer', gender: 'Male', phone: '+91 98220 55667', email: 'vikram.patil@jalgaon.aero' },
    { empId: 'CRW-301', name: 'Priya Deshmukh', role: 'Cabin Crew Lead', gender: 'Female', phone: '+91 98220 77889', email: 'priya.deshmukh@jalgaon.aero' },
    { empId: 'CRW-302', name: 'Sneha Kulkarni', role: 'Cabin Crew', gender: 'Female', phone: '+91 98220 88990', email: 'sneha.kulkarni@jalgaon.aero' },
    { empId: 'CRW-303', name: 'Pooja Joshi', role: 'Cabin Crew', gender: 'Female', phone: '+91 98220 99001', email: 'pooja.joshi@jalgaon.aero' },
    { empId: 'CRW-304', name: 'Meera Patel', role: 'Cabin Crew', gender: 'Female', phone: '+91 98220 12345', email: 'meera.patel@jalgaon.aero' },
    { empId: 'CRW-305', name: 'Riya Shinde', role: 'Cabin Crew', gender: 'Female', phone: '+91 98220 23456', email: 'riya.shinde@jalgaon.aero' }
  ];

  const insertCrew = db.prepare(`
    INSERT INTO crew_members (employeeId, name, role, gender, phone, email, status)
    VALUES (?, ?, ?, ?, ?, ?, 'Active')
  `);

  for (const c of defaultCrew) {
    insertCrew.run(c.empId, c.name, c.role, c.gender, c.phone, c.email);
  }
}

// Seed initial Weather Data if airport_weather is empty
const weatherCount = db.prepare('SELECT count(*) as count FROM airport_weather').get().count;
if (weatherCount === 0) {
  const defaultWeather = [
    { code: 'JLG', city: 'Jalgaon Airport', temp: 31.5, condition: 'Clear Sky', wind: 8.2, dir: 'WSW', vis: 10000, press: 1013.2, safety: 'SAFE_TO_FLY' },
    { code: 'BOM', city: 'Mumbai International', temp: 29.0, condition: 'Scattered Clouds', wind: 14.5, dir: 'SW', vis: 8000, press: 1011.8, safety: 'SAFE_TO_FLY' },
    { code: 'DEL', city: 'Delhi IGI Airport', temp: 24.2, condition: 'Dense Fog', wind: 5.0, dir: 'NW', vis: 1200, press: 1016.5, safety: 'DELAYED_DENSE_FOG' },
    { code: 'PNQ', city: 'Pune Airport', temp: 27.8, condition: 'Clear Sky', wind: 9.0, dir: 'WNW', vis: 9500, press: 1014.0, safety: 'SAFE_TO_FLY' },
    { code: 'HYD', city: 'Hyderabad Rajiv Gandhi', temp: 30.1, condition: 'Clear Sky', wind: 11.2, dir: 'SE', vis: 10000, press: 1012.0, safety: 'SAFE_TO_FLY' },
    { code: 'GOI', city: 'Goa Dabolim Airport', temp: 32.0, condition: 'Thunderstorm', wind: 28.4, dir: 'SSW', vis: 3500, press: 1008.2, safety: 'REROUTE_THUNDERSTORM' },
    { code: 'BLR', city: 'Kempegowda Bengaluru', temp: 26.4, condition: 'Scattered Clouds', wind: 12.0, dir: 'E', vis: 9000, press: 1015.1, safety: 'SAFE_TO_FLY' }
  ];

  const insertWeather = db.prepare(`
    INSERT INTO airport_weather (airportCode, city, tempCelsius, condition, windSpeedKnots, windDirection, visibilityMeters, pressureHpa, safetyStatus)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const w of defaultWeather) {
    insertWeather.run(w.code, w.city, w.temp, w.condition, w.wind, w.dir, w.vis, w.press, w.safety);
  }
}

console.log('✅ SQLite Database schema verified and up-to-date with Crew, Flight Roster & Weather tables.');

export default db;

