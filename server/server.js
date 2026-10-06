import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import db from './db.js';
import { getAutoDistance, AIRPORT_COORDINATES } from './distanceService.js';
import { calculateFlightPrice } from './pricingService.js';
import { calculateCarbonEmissions } from './carbonService.js';
import { AIService } from './aiService.js';

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'jalgaon_airline_super_secure_jwt_secret_2026';

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// AUTHENTICATION & AUTHORIZATION MIDDLEWARES
// ----------------------------------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Missing token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
}

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const result = db.prepare(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, 'USER')
    `).run(name.trim(), email.toLowerCase().trim(), hashedPassword);

    const user = { id: result.lastInsertRowid, name: name.trim(), email: email.toLowerCase().trim(), role: 'USER' };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ success: true, message: 'Registration successful', user, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, message: 'Logged in successfully', user: userData, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, createdAt FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
});

// ----------------------------------------------------
// UTILITY / PUBLIC AIRPORTS & DISTANCE
// ----------------------------------------------------
app.get('/api/airports', (req, res) => {
  const airports = Object.entries(AIRPORT_COORDINATES).map(([code, data]) => ({
    code,
    name: data.name,
    city: data.city,
    display: `${data.city} (${code})`
  }));
  res.json({ success: true, airports });
});

app.post('/api/calculate-distance', (req, res) => {
  const { source, destination } = req.body;
  const distance = getAutoDistance(source, destination);
  res.json({ success: true, distance: distance || null });
});

// ----------------------------------------------------
// PRICING & SYSTEM CONFIGURATION (ADMIN)
// ----------------------------------------------------
app.get('/api/pricing/config', (req, res) => {
  const config = db.prepare('SELECT * FROM pricing_config WHERE id = 1').get();
  res.json({ success: true, config });
});

app.put('/api/admin/pricing', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { 
      basePrice, pricePerKm, fuelPricePerLiter, fuelConsumptionPerKm, serviceCharge, taxPercentage,
      co2EmissionFactor, emissionFactorUnit, highDemandOccupancyThreshold, lowDemandOccupancyThreshold,
      surgeAdjustmentPercent, discountAdjustmentPercent, minHistoricalBookingsRequired
    } = req.body;

    db.prepare(`
      UPDATE pricing_config
      SET basePrice = ?, pricePerKm = ?, fuelPricePerLiter = ?, fuelConsumptionPerKm = ?, serviceCharge = ?, taxPercentage = ?,
          co2EmissionFactor = ?, emissionFactorUnit = ?, highDemandOccupancyThreshold = ?, lowDemandOccupancyThreshold = ?,
          surgeAdjustmentPercent = ?, discountAdjustmentPercent = ?, minHistoricalBookingsRequired = ?,
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(
      Number(basePrice),
      Number(pricePerKm),
      Number(fuelPricePerLiter),
      Number(fuelConsumptionPerKm),
      Number(serviceCharge),
      Number(taxPercentage),
      Number(co2EmissionFactor || 2.52),
      emissionFactorUnit || 'kg CO2/L',
      Number(highDemandOccupancyThreshold || 75),
      Number(lowDemandOccupancyThreshold || 40),
      Number(surgeAdjustmentPercent || 12),
      Number(discountAdjustmentPercent || 10),
      Number(minHistoricalBookingsRequired || 3)
    );

    const updated = db.prepare('SELECT * FROM pricing_config WHERE id = 1').get();
    res.json({ success: true, message: 'Configuration parameters updated successfully.', config: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/pricing/preview', (req, res) => {
  const { distanceKm, basePrice, pricePerKm, fuelPricePerLiter, fuelConsumptionPerKm, serviceCharge, taxPercentage } = req.body;
  const preview = calculateFlightPrice({
    distanceKm,
    basePrice,
    pricePerKm,
    fuelPricePerLiter,
    fuelConsumptionPerKm,
    serviceCharge,
    taxPercentage
  });
  res.json({ success: true, preview });
});

// ----------------------------------------------------
// FLIGHT MANAGEMENT (ADMIN)
// ----------------------------------------------------
app.get('/api/admin/flights', authenticateToken, requireAdmin, (req, res) => {
  const flights = db.prepare('SELECT * FROM flights ORDER BY id DESC').all();
  // Attach carbon per seat calculation to each flight
  for (const f of flights) {
    const carbon = calculateCarbonEmissions({
      distanceKm: f.distance,
      fuelConsumptionPerKm: f.fuelConsumptionPerKm,
      co2EmissionFactor: 2.52,
      totalSeats: f.totalSeats
    });
    f.carbonMetrics = carbon;
  }
  res.json({ success: true, flights });
});

app.post('/api/admin/flights', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      flightNumber, airline, aircraft, source, destination,
      departureDate, departureTime, arrivalDate, arrivalTime,
      totalSeats, distance: manualDistance, status = 'Scheduled'
    } = req.body;

    if (!flightNumber || !airline || !aircraft || !source || !destination || !departureDate || !departureTime || !arrivalDate || !arrivalTime || !totalSeats) {
      return res.status(400).json({ success: false, message: 'All required flight fields must be provided.' });
    }

    const existing = db.prepare('SELECT id FROM flights WHERE flightNumber = ?').get(flightNumber.trim().toUpperCase());
    if (existing) {
      return res.status(400).json({ success: false, message: `Flight number ${flightNumber} already exists.` });
    }

    let distance = Number(manualDistance);
    if (!distance || distance <= 0) {
      distance = getAutoDistance(source, destination) || 500;
    }

    const config = db.prepare('SELECT * FROM pricing_config WHERE id = 1').get();

    // 1. Automatic Price Calculation
    const priceBreakdown = calculateFlightPrice({
      distanceKm: distance,
      basePrice: config.basePrice,
      pricePerKm: config.pricePerKm,
      fuelPricePerLiter: config.fuelPricePerLiter,
      fuelConsumptionPerKm: config.fuelConsumptionPerKm,
      serviceCharge: config.serviceCharge,
      taxPercentage: config.taxPercentage
    });

    // 2. Automatic Carbon & Fuel Emission Calculation
    const carbon = calculateCarbonEmissions({
      distanceKm: distance,
      fuelConsumptionPerKm: config.fuelConsumptionPerKm,
      co2EmissionFactor: config.co2EmissionFactor,
      totalSeats: Number(totalSeats)
    });

    const seats = Number(totalSeats);

    const insert = db.prepare(`
      INSERT INTO flights (
        flightNumber, airline, aircraft, source, destination,
        departureDate, departureTime, arrivalDate, arrivalTime,
        totalSeats, availableSeats, distance,
        basePrice, fuelPricePerLiter, fuelConsumptionPerKm, pricePerKm, serviceCharge, taxPercentage,
        calculatedPrice, status, fuelConsumedLiters, totalEstimatedCo2Kg
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      flightNumber.trim().toUpperCase(),
      airline.trim(),
      aircraft.trim(),
      source.trim(),
      destination.trim(),
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      seats,
      seats,
      distance,
      config.basePrice,
      config.fuelPricePerLiter,
      config.fuelConsumptionPerKm,
      config.pricePerKm,
      config.serviceCharge,
      config.taxPercentage,
      priceBreakdown.finalPrice,
      status,
      carbon.fuelConsumedLiters,
      carbon.totalCo2Kg
    );

    const createdFlight = db.prepare('SELECT * FROM flights WHERE id = ?').get(result.lastInsertRowid);
    createdFlight.carbonMetrics = carbon;
    res.status(201).json({ success: true, message: 'Flight successfully created.', flight: createdFlight, priceBreakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/admin/flights/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const flightId = req.params.id;
    const existing = db.prepare('SELECT * FROM flights WHERE id = ?').get(flightId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Flight not found.' });
    }

    const {
      flightNumber, airline, aircraft, source, destination,
      departureDate, departureTime, arrivalDate, arrivalTime,
      totalSeats, distance: manualDistance, status
    } = req.body;

    let distance = Number(manualDistance) || existing.distance;
    if (source !== existing.source || destination !== existing.destination) {
      distance = getAutoDistance(source, destination) || distance;
    }

    const config = db.prepare('SELECT * FROM pricing_config WHERE id = 1').get();
    const priceBreakdown = calculateFlightPrice({
      distanceKm: distance,
      basePrice: config.basePrice,
      pricePerKm: config.pricePerKm,
      fuelPricePerLiter: config.fuelPricePerLiter,
      fuelConsumptionPerKm: config.fuelConsumptionPerKm,
      serviceCharge: config.serviceCharge,
      taxPercentage: config.taxPercentage
    });

    const carbon = calculateCarbonEmissions({
      distanceKm: distance,
      fuelConsumptionPerKm: config.fuelConsumptionPerKm,
      co2EmissionFactor: config.co2EmissionFactor,
      totalSeats: Number(totalSeats) || existing.totalSeats
    });

    const bookedSeats = existing.totalSeats - existing.availableSeats;
    const newTotalSeats = Number(totalSeats) || existing.totalSeats;
    const newAvailableSeats = Math.max(0, newTotalSeats - bookedSeats);

    db.prepare(`
      UPDATE flights SET
        flightNumber = ?, airline = ?, aircraft = ?, source = ?, destination = ?,
        departureDate = ?, departureTime = ?, arrivalDate = ?, arrivalTime = ?,
        totalSeats = ?, availableSeats = ?, distance = ?,
        calculatedPrice = ?, status = ?, fuelConsumedLiters = ?, totalEstimatedCo2Kg = ?
      WHERE id = ?
    `).run(
      (flightNumber || existing.flightNumber).trim().toUpperCase(),
      (airline || existing.airline).trim(),
      (aircraft || existing.aircraft).trim(),
      (source || existing.source).trim(),
      (destination || existing.destination).trim(),
      departureDate || existing.departureDate,
      departureTime || existing.departureTime,
      arrivalDate || existing.arrivalDate,
      arrivalTime || existing.arrivalTime,
      newTotalSeats,
      newAvailableSeats,
      distance,
      priceBreakdown.finalPrice,
      status || existing.status,
      carbon.fuelConsumedLiters,
      carbon.totalCo2Kg,
      flightId
    );

    const updated = db.prepare('SELECT * FROM flights WHERE id = ?').get(flightId);
    updated.carbonMetrics = carbon;
    res.json({ success: true, message: 'Flight updated successfully.', flight: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update flight status only (Scheduled, Boarding, Departed, Arrived, Delayed, Cancelled)
app.patch('/api/admin/flights/:id/status', authenticateToken, requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

  db.prepare('UPDATE flights SET status = ? WHERE id = ?').run(status, req.params.id);
  
  if (status === 'Cancelled') {
    db.prepare("UPDATE bookings SET status = 'CANCELLED' WHERE flightId = ?").run(req.params.id);
  }

  res.json({ success: true, message: `Flight status updated to ${status}` });
});

// Admin overrides price with AI recommendation
app.patch('/api/admin/flights/:id/apply-ai-price', authenticateToken, requireAdmin, (req, res) => {
  const { recommendedPrice } = req.body;
  if (!recommendedPrice) return res.status(400).json({ success: false, message: 'Price is required' });

  db.prepare('UPDATE flights SET calculatedPrice = ? WHERE id = ?').run(Number(recommendedPrice), req.params.id);
  res.json({ success: true, message: `Dynamic AI price (Rs ${Number(recommendedPrice).toLocaleString()}) successfully applied.` });
});

app.delete('/api/admin/flights/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const flightId = req.params.id;
    const bookingCount = db.prepare("SELECT count(*) as count FROM bookings WHERE flightId = ? AND status = 'CONFIRMED'").get(flightId).count;
    if (bookingCount > 0) {
      db.prepare("UPDATE flights SET status = 'Cancelled' WHERE id = ?").run(flightId);
      return res.json({ success: true, message: 'Flight has active bookings; status marked as Cancelled.' });
    }

    db.prepare('DELETE FROM flights WHERE id = ?').run(flightId);
    res.json({ success: true, message: 'Flight deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Stats
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const totalFlights = db.prepare('SELECT count(*) as count FROM flights').get().count;
  const activeFlights = db.prepare("SELECT count(*) as count FROM flights WHERE status != 'Cancelled' AND status != 'INACTIVE'").get().count;
  const totalUsers = db.prepare("SELECT count(*) as count FROM users WHERE role = 'USER'").get().count;
  const totalBookings = db.prepare('SELECT count(*) as count FROM bookings').get().count;
  const totalTickets = db.prepare('SELECT count(*) as count FROM tickets').get().count;
  const revenueResult = db.prepare("SELECT sum(totalAmount) as rev FROM bookings WHERE status = 'CONFIRMED'").get();
  const revenue = revenueResult?.rev || 0;
  const availableSeatsResult = db.prepare("SELECT sum(availableSeats) as seats FROM flights WHERE status != 'Cancelled'").get();
  const availableSeats = availableSeatsResult?.seats || 0;

  // Carbon metrics
  const totalCo2 = db.prepare("SELECT sum(totalEstimatedCo2Kg) as co2 FROM flights WHERE status != 'Cancelled'").get()?.co2 || 0;

  // Seat occupancy
  const seatAgg = db.prepare("SELECT sum(totalSeats) as total, sum(availableSeats) as avail FROM flights WHERE status != 'Cancelled'").get();
  const totalSeats = seatAgg?.total || 0;
  const bookedSeats = totalSeats - (seatAgg?.avail || 0);
  const avgOccupancy = totalSeats > 0 ? parseFloat(((bookedSeats / totalSeats) * 100).toFixed(1)) : 0;

  res.json({
    success: true,
    stats: {
      totalFlights,
      activeFlights,
      totalUsers,
      totalBookings,
      totalTickets,
      revenue,
      availableSeats,
      totalEstimatedCo2Kg: totalCo2,
      totalEstimatedCo2Tonnes: parseFloat((totalCo2 / 1000).toFixed(2)),
      avgOccupancy
    }
  });
});

app.get('/api/admin/bookings', authenticateToken, requireAdmin, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, u.name as userName, u.email as userEmail,
           f.flightNumber, f.airline, f.source, f.destination, f.departureDate, f.departureTime, f.status as flightStatus
    FROM bookings b
    JOIN users u ON b.userId = u.id
    JOIN flights f ON b.flightId = f.id
    ORDER BY b.id DESC
  `).all();

  for (const b of bookings) {
    b.passengers = db.prepare('SELECT * FROM passengers WHERE bookingId = ?').all(b.bookingId);
  }

  res.json({ success: true, bookings });
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, createdAt FROM users ORDER BY id DESC').all();
  res.json({ success: true, users });
});

app.get('/api/admin/tickets', authenticateToken, requireAdmin, (req, res) => {
  const tickets = db.prepare(`
    SELECT t.*, b.userId, b.flightId, b.totalAmount, b.passengerCount,
           f.flightNumber, f.airline, f.aircraft, f.source, f.destination,
           f.departureDate, f.departureTime, f.arrivalDate, f.arrivalTime
    FROM tickets t
    JOIN bookings b ON t.bookingId = b.bookingId
    JOIN flights f ON b.flightId = f.id
    ORDER BY t.id DESC
  `).all();

  for (const t of tickets) {
    try {
      t.passengerList = JSON.parse(t.passengerDetails);
    } catch {
      t.passengerList = [];
    }
  }

  res.json({ success: true, tickets });
});

// ----------------------------------------------------
// CREW STAFF & PILOT MANAGEMENT ROUTES
// ----------------------------------------------------
app.get('/api/admin/crew', authenticateToken, requireAdmin, (req, res) => {
  const crew = db.prepare('SELECT * FROM crew_members ORDER BY id DESC').all();
  res.json({ success: true, crew });
});

app.post('/api/admin/crew', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { employeeId, name, role, gender = 'Female', phone, email } = req.body;
    if (!employeeId || !name || !role) {
      return res.status(400).json({ success: false, message: 'Employee ID, Name, and Role are required.' });
    }

    const existing = db.prepare('SELECT id FROM crew_members WHERE employeeId = ?').get(employeeId.trim().toUpperCase());
    if (existing) {
      return res.status(400).json({ success: false, message: `Crew member with ID ${employeeId} already exists.` });
    }

    const result = db.prepare(`
      INSERT INTO crew_members (employeeId, name, role, gender, phone, email, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Active')
    `).run(employeeId.trim().toUpperCase(), name.trim(), role.trim(), gender, phone || '', email || '');

    const newCrew = db.prepare('SELECT * FROM crew_members WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, message: 'Crew member added successfully.', crew: newCrew });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/admin/crew/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { employeeId, name, role, gender, phone, email, status } = req.body;
    const existing = db.prepare('SELECT * FROM crew_members WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Crew member not found.' });

    db.prepare(`
      UPDATE crew_members
      SET employeeId = ?, name = ?, role = ?, gender = ?, phone = ?, email = ?, status = ?
      WHERE id = ?
    `).run(
      (employeeId || existing.employeeId).trim().toUpperCase(),
      (name || existing.name).trim(),
      (role || existing.role).trim(),
      gender || existing.gender,
      phone !== undefined ? phone : existing.phone,
      email !== undefined ? email : existing.email,
      status || existing.status,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM crew_members WHERE id = ?').get(req.params.id);
    res.json({ success: true, message: 'Crew member updated successfully.', crew: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/admin/crew/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM crew_assignments WHERE crewId = ?').run(req.params.id);
    db.prepare('DELETE FROM crew_members WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Crew member removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Flight Crew Roster Assignment Endpoints
app.get('/api/admin/flights/:id/crew', authenticateToken, requireAdmin, (req, res) => {
  const assigned = db.prepare(`
    SELECT ca.id as assignmentId, ca.assignedRole, ca.assignedAt,
           cm.id as crewId, cm.employeeId, cm.name, cm.role, cm.gender, cm.phone, cm.email, cm.status
    FROM crew_assignments ca
    JOIN crew_members cm ON ca.crewId = cm.id
    WHERE ca.flightId = ?
    ORDER BY ca.id ASC
  `).all(req.params.id);

  res.json({ success: true, assignedCrew: assigned });
});

app.post('/api/admin/flights/:id/crew', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { crewId, assignedRole } = req.body;
    if (!crewId) return res.status(400).json({ success: false, message: 'Crew ID is required.' });

    const crew = db.prepare('SELECT * FROM crew_members WHERE id = ?').get(crewId);
    if (!crew) return res.status(404).json({ success: false, message: 'Crew member not found.' });

    const existingAssignment = db.prepare('SELECT id FROM crew_assignments WHERE flightId = ? AND crewId = ?').get(req.params.id, crewId);
    if (existingAssignment) {
      return res.status(400).json({ success: false, message: `${crew.name} is already assigned to this flight.` });
    }

    db.prepare(`
      INSERT INTO crew_assignments (flightId, crewId, assignedRole)
      VALUES (?, ?, ?)
    `).run(req.params.id, crewId, assignedRole || crew.role);

    res.status(201).json({ success: true, message: `${crew.name} successfully assigned to flight.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/admin/flights/:id/crew/:crewId', authenticateToken, requireAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM crew_assignments WHERE flightId = ? AND crewId = ?').run(req.params.id, req.params.crewId);
    res.json({ success: true, message: 'Crew member unassigned from flight.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/admin/crew/assignments', authenticateToken, requireAdmin, (req, res) => {
  const assignments = db.prepare(`
    SELECT ca.flightId, f.flightNumber, f.source, f.destination, f.departureDate, f.departureTime,
           ca.crewId, cm.name as crewName, cm.role as crewRole, cm.gender as crewGender, cm.employeeId
    FROM crew_assignments ca
    JOIN flights f ON ca.flightId = f.id
    JOIN crew_members cm ON ca.crewId = cm.id
    ORDER BY ca.flightId DESC
  `).all();

  res.json({ success: true, assignments });
});

// ----------------------------------------------------
// AVIATION WEATHER INTELLIGENCE & RADAR ROUTES
// ----------------------------------------------------
app.get('/api/weather', (req, res) => {
  try {
    const weather = db.prepare('SELECT * FROM airport_weather ORDER BY airportCode ASC').all();
    res.json({ success: true, weather });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/weather/:airportCode', (req, res) => {
  try {
    const code = req.params.airportCode.toUpperCase();
    const weather = db.prepare('SELECT * FROM airport_weather WHERE airportCode = ?').get(code);
    if (!weather) return res.status(404).json({ success: false, message: 'Airport weather not found.' });
    res.json({ success: true, weather });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/admin/weather/:airportCode', authenticateToken, requireAdmin, (req, res) => {
  try {
    const code = req.params.airportCode.toUpperCase();
    const { tempCelsius, condition, windSpeedKnots, windDirection, visibilityMeters, pressureHpa, safetyStatus } = req.body;

    const existing = db.prepare('SELECT * FROM airport_weather WHERE airportCode = ?').get(code);
    if (!existing) return res.status(404).json({ success: false, message: 'Airport code not found.' });

    db.prepare(`
      UPDATE airport_weather
      SET tempCelsius = COALESCE(?, tempCelsius),
          condition = COALESCE(?, condition),
          windSpeedKnots = COALESCE(?, windSpeedKnots),
          windDirection = COALESCE(?, windDirection),
          visibilityMeters = COALESCE(?, visibilityMeters),
          pressureHpa = COALESCE(?, pressureHpa),
          safetyStatus = COALESCE(?, safetyStatus),
          updatedAt = CURRENT_TIMESTAMP
      WHERE airportCode = ?
    `).run(tempCelsius, condition, windSpeedKnots, windDirection, visibilityMeters, pressureHpa, safetyStatus, code);

    const updated = db.prepare('SELECT * FROM airport_weather WHERE airportCode = ?').get(code);
    res.json({ success: true, message: `Weather updated for ${code}`, weather: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ----------------------------------------------------
// AI REVENUE, OPERATIONS & SUSTAINABILITY ROUTES
// ----------------------------------------------------
app.get('/api/admin/ai/pricing-recommendations', authenticateToken, requireAdmin, (req, res) => {
  const recommendations = AIService.getDynamicPricingRecommendations();
  res.json({ success: true, recommendations });
});

app.get('/api/admin/ai/demand-forecast', authenticateToken, requireAdmin, (req, res) => {
  const forecastData = AIService.getDemandForecast();
  res.json({ success: true, ...forecastData });
});

app.get('/api/admin/analytics/revenue', authenticateToken, requireAdmin, (req, res) => {
  const filter = req.query.period || 'all';
  const analytics = AIService.getRevenueAnalytics(filter);
  res.json({ success: true, analytics });
});

app.get('/api/admin/analytics/sustainability', authenticateToken, requireAdmin, (req, res) => {
  const sustainability = AIService.getSustainabilityAnalytics();
  res.json({ success: true, sustainability });
});

app.get('/api/admin/ai/operational-insights', authenticateToken, requireAdmin, (req, res) => {
  const insights = AIService.getOperationalAndSustainabilityInsights();
  res.json({ success: true, insights });
});

app.post('/api/admin/ai/assistant', authenticateToken, requireAdmin, (req, res) => {
  const { query } = req.body;
  const response = AIService.answerAdminQuery(query);
  res.json({ success: true, ...response });
});

// Combined Flight Analytics & Comparison
app.get('/api/admin/analytics/flights-combined', authenticateToken, requireAdmin, (req, res) => {
  const analytics = AIService.getRevenueAnalytics('all');
  res.json({ success: true, flights: analytics.flightsPerformance });
});

// ----------------------------------------------------
// USER FLIGHT SEARCH & BOOKING
// ----------------------------------------------------
app.get('/api/flights/search', (req, res) => {
  const { from, to, date, passengers = 1 } = req.query;
  const reqSeats = Math.max(1, Number(passengers));

  let query = "SELECT * FROM flights WHERE status != 'Cancelled' AND status != 'INACTIVE' AND availableSeats >= ?";
  const params = [reqSeats];

  if (from) {
    query += ' AND (source LIKE ? OR source LIKE ?)';
    params.push(`%${from}%`, `%${from.toUpperCase()}%`);
  }
  if (to) {
    query += ' AND (destination LIKE ? OR destination LIKE ?)';
    params.push(`%${to}%`, `%${to.toUpperCase()}%`);
  }
  if (date) {
    query += ' AND departureDate = ?';
    params.push(date);
  }

  query += ' ORDER BY departureDate ASC, departureTime ASC';
  const flights = db.prepare(query).all(...params);

  // Attach estimated carbon per passenger for users
  for (const f of flights) {
    const carbon = calculateCarbonEmissions({
      distanceKm: f.distance,
      fuelConsumptionPerKm: f.fuelConsumptionPerKm,
      co2EmissionFactor: 2.52,
      totalSeats: f.totalSeats
    });
    f.carbonMetrics = carbon;
  }

  res.json({ success: true, flights });
});

app.get('/api/flights/:id', (req, res) => {
  const flight = db.prepare('SELECT * FROM flights WHERE id = ?').get(req.params.id);
  if (!flight) return res.status(404).json({ success: false, message: 'Flight not found.' });

  flight.carbonMetrics = calculateCarbonEmissions({
    distanceKm: flight.distance,
    fuelConsumptionPerKm: flight.fuelConsumptionPerKm,
    co2EmissionFactor: 2.52,
    totalSeats: flight.totalSeats
  });

  res.json({ success: true, flight });
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
  const { flightId, passengers } = req.body;

  if (!flightId || !Array.isArray(passengers) || passengers.length === 0) {
    return res.status(400).json({ success: false, message: 'Flight ID and at least one passenger required.' });
  }

  const passengerCount = passengers.length;

  const executeBooking = db.transaction(() => {
    const flight = db.prepare('SELECT * FROM flights WHERE id = ?').get(flightId);
    if (!flight) throw new Error('Flight does not exist.');
    if (flight.status === 'Cancelled' || flight.status === 'INACTIVE') {
      throw new Error('This flight is not open for passenger bookings.');
    }
    if (flight.availableSeats < passengerCount) {
      throw new Error(`Only ${flight.availableSeats} seat(s) available on this flight.`);
    }

    const config = db.prepare('SELECT * FROM pricing_config WHERE id = 1').get();
    
    // Strict Backend Recalculation
    const priceCalculation = calculateFlightPrice({
      distanceKm: flight.distance,
      basePrice: config.basePrice,
      pricePerKm: config.pricePerKm,
      fuelPricePerLiter: config.fuelPricePerLiter,
      fuelConsumptionPerKm: config.fuelConsumptionPerKm,
      serviceCharge: config.serviceCharge,
      taxPercentage: config.taxPercentage
    });

    const pricePerPassenger = flight.calculatedPrice || priceCalculation.finalPrice;
    const totalAmount = pricePerPassenger * passengerCount;

    // Carbon per passenger
    const carbon = calculateCarbonEmissions({
      distanceKm: flight.distance,
      fuelConsumptionPerKm: flight.fuelConsumptionPerKm,
      co2EmissionFactor: config.co2EmissionFactor,
      totalSeats: flight.totalSeats
    });

    // Decrement available seats atomically
    const newAvailable = flight.availableSeats - passengerCount;
    db.prepare('UPDATE flights SET availableSeats = ? WHERE id = ?').run(newAvailable, flightId);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `BK${dateStr}${randomSuffix}`;

    db.prepare(`
      INSERT INTO bookings (bookingId, userId, flightId, passengerCount, pricePerPassenger, totalAmount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')
    `).run(bookingId, req.user.id, flightId, passengerCount, pricePerPassenger, totalAmount);

    const seatPrefixes = ['A', 'B', 'C', 'D', 'E', 'F'];
    const assignedPassengers = [];

    const insertPassenger = db.prepare(`
      INSERT INTO passengers (bookingId, name, age, gender, email, phone, seatNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    passengers.forEach((p, idx) => {
      const seatRow = Math.floor((flight.totalSeats - newAvailable + idx) / 6) + 1;
      const seatCol = seatPrefixes[(flight.totalSeats - newAvailable + idx) % 6];
      const seatNumber = `${seatRow}${seatCol}`;

      insertPassenger.run(
        bookingId,
        p.name.trim(),
        Number(p.age) || 25,
        p.gender || 'Other',
        p.email || req.user.email,
        p.phone || '',
        seatNumber
      );

      assignedPassengers.push({ ...p, seatNumber });
    });

    const pnr = `PNR${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const ticketId = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    return {
      bookingId,
      ticketId,
      pnr,
      flight,
      pricePerPassenger,
      totalAmount,
      passengerCount,
      assignedPassengers,
      co2PerPaxKg: carbon.co2PerPaxKg
    };
  });

  try {
    const result = executeBooking();

    const qrPayload = JSON.stringify({
      app: 'Jalgaon Airline',
      pnr: result.pnr,
      bookingId: result.bookingId,
      flight: result.flight.flightNumber,
      seats: result.passengerCount,
      co2Pax: `${result.co2PerPaxKg} kg`,
      verify: 'https://jalgaon.aero/verify'
    });
    const qrCodeData = await QRCode.toDataURL(qrPayload);

    db.prepare(`
      INSERT INTO tickets (ticketId, bookingId, pnr, passengerDetails, qrCodeData, estimatedCo2PerPaxKg, status)
      VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')
    `).run(result.ticketId, result.bookingId, result.pnr, JSON.stringify(result.assignedPassengers), qrCodeData, result.co2PerPaxKg);

    const fullTicket = {
      ticketId: result.ticketId,
      bookingId: result.bookingId,
      pnr: result.pnr,
      flightNumber: result.flight.flightNumber,
      airline: result.flight.airline,
      aircraft: result.flight.aircraft,
      source: result.flight.source,
      destination: result.flight.destination,
      departureDate: result.flight.departureDate,
      departureTime: result.flight.departureTime,
      arrivalDate: result.flight.arrivalDate,
      arrivalTime: result.flight.arrivalTime,
      passengerCount: result.passengerCount,
      passengers: result.assignedPassengers,
      pricePerPassenger: result.pricePerPassenger,
      totalAmount: result.totalAmount,
      estimatedCo2PerPaxKg: result.co2PerPaxKg,
      qrCodeData,
      status: 'CONFIRMED',
      issueDate: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Booking successfully confirmed! Your ticket has been generated.',
      bookingId: result.bookingId,
      ticket: fullTicket
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/bookings/my', authenticateToken, (req, res) => {
  const bookings = db.prepare(`
    SELECT b.*, f.flightNumber, f.airline, f.aircraft, f.source, f.destination,
           f.departureDate, f.departureTime, f.arrivalDate, f.arrivalTime, f.status as flightStatus,
           t.ticketId, t.pnr, t.qrCodeData, t.estimatedCo2PerPaxKg
    FROM bookings b
    JOIN flights f ON b.flightId = f.id
    LEFT JOIN tickets t ON b.bookingId = t.bookingId
    WHERE b.userId = ?
    ORDER BY b.id DESC
  `).all(req.user.id);

  for (const b of bookings) {
    b.passengers = db.prepare('SELECT * FROM passengers WHERE bookingId = ?').all(b.bookingId);
  }

  res.json({ success: true, bookings });
});

app.get('/api/tickets/my', authenticateToken, (req, res) => {
  const tickets = db.prepare(`
    SELECT t.*, b.totalAmount, b.pricePerPassenger, b.passengerCount, b.bookingDate,
           f.flightNumber, f.airline, f.aircraft, f.source, f.destination,
           f.departureDate, f.departureTime, f.arrivalDate, f.arrivalTime, f.status as flightStatus
    FROM tickets t
    JOIN bookings b ON t.bookingId = b.bookingId
    JOIN flights f ON b.flightId = f.id
    WHERE b.userId = ?
    ORDER BY t.id DESC
  `).all(req.user.id);

  for (const t of tickets) {
    try {
      t.passengers = JSON.parse(t.passengerDetails);
    } catch {
      t.passengers = [];
    }
  }

  res.json({ success: true, tickets });
});

app.get('/api/tickets/:id', authenticateToken, (req, res) => {
  const ticket = db.prepare(`
    SELECT t.*, b.userId, b.totalAmount, b.pricePerPassenger, b.passengerCount, b.bookingDate,
           f.flightNumber, f.airline, f.aircraft, f.source, f.destination,
           f.departureDate, f.departureTime, f.arrivalDate, f.arrivalTime, f.status as flightStatus
    FROM tickets t
    JOIN bookings b ON t.bookingId = b.bookingId
    JOIN flights f ON b.flightId = f.id
    WHERE t.ticketId = ? OR t.bookingId = ? OR t.pnr = ?
  `).get(req.params.id, req.params.id, req.params.id);

  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found.' });

  if (req.user.role !== 'ADMIN' && ticket.userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied. You do not own this ticket.' });
  }

  try {
    ticket.passengers = JSON.parse(ticket.passengerDetails);
  } catch {
    ticket.passengers = [];
  }

  res.json({ success: true, ticket });
});

app.listen(PORT, () => {
  console.log(`✈️ AI-Powered Jalgaon Airline REST API Server is running on http://localhost:${PORT}`);
});
