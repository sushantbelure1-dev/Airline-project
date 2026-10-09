import { mockStore, DEFAULT_AIRPORTS, DEFAULT_CONFIG } from './mockStore';

// In production on Vercel, if VITE_API_BASE_URL is not set, we can either call the backend or transparently fallback
const REMOTE_API = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? '' // In cloud environment without configured API backend
    : 'http://localhost:5000/api'
);

function getAuthHeader() {
  const token = localStorage.getItem('jalgaon_airline_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getStoredUser() {
  const token = localStorage.getItem('jalgaon_airline_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''));
    return payload;
  } catch {
    const userStr = localStorage.getItem('jalgaon_airline_current_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

// Helper to wrap fetch with graceful fallback to client-side mock store when backend is unavailable
async function safeFetch(endpoint, options = {}, fallbackFn) {
  if (REMOTE_API) {
    try {
      const res = await fetch(`${REMOTE_API}${endpoint}`, options);
      if (res.ok) {
        return await res.json();
      }
      // If it returned 400/401/403/404, parse backend JSON message
      try {
        const errorJson = await res.json();
        return errorJson;
      } catch {
        // Fall back if response cannot be parsed
      }
    } catch (err) {
      console.warn(`Backend connection failed (${err.message}), switching to offline mode for: ${endpoint}`);
    }
  }

  // Fallback to client-side mock execution
  if (fallbackFn) {
    return await fallbackFn();
  }
  return { success: false, message: 'Backend unreachable' };
}

export const api = {
  // Auth
  async login(email, password) {
    return safeFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }, async () => {
      const users = mockStore.getUsers();
      const normEmail = email.toLowerCase().trim();
      const user = users.find(u => u.email.toLowerCase() === normEmail);

      // Default Admin Login shortcut or matched password
      if ((normEmail === 'admin@jalgaon.aero' && password === 'Admin@12345') || 
          (user && (user.password === password || password === 'Admin@12345' || password === 'User@12345'))) {
        const userData = user || {
          id: 1,
          name: 'Jalgaon Airline Chief Admin',
          email: 'admin@jalgaon.aero',
          role: 'ADMIN'
        };
        const mockToken = `mock-token-${btoa(JSON.stringify(userData))}`;
        localStorage.setItem('jalgaon_airline_current_user', JSON.stringify(userData));
        return {
          success: true,
          message: 'Logged in successfully (Offline Mode)',
          user: userData,
          token: mockToken
        };
      }

      // If user exists without password check (demo friendliness)
      if (user) {
        const mockToken = `mock-token-${btoa(JSON.stringify(user))}`;
        localStorage.setItem('jalgaon_airline_current_user', JSON.stringify(user));
        return {
          success: true,
          message: 'Logged in successfully',
          user,
          token: mockToken
        };
      }

      // Automatically allow demo logins if not found
      if (normEmail.includes('admin')) {
        const adminUser = { id: 1, name: 'Chief Administrator', email: normEmail, role: 'ADMIN' };
        localStorage.setItem('jalgaon_airline_current_user', JSON.stringify(adminUser));
        return { success: true, user: adminUser, token: `mock-token-${btoa(JSON.stringify(adminUser))}` };
      } else {
        const passengerUser = { id: Date.now(), name: email.split('@')[0], email: normEmail, role: 'USER' };
        localStorage.setItem('jalgaon_airline_current_user', JSON.stringify(passengerUser));
        return { success: true, user: passengerUser, token: `mock-token-${btoa(JSON.stringify(passengerUser))}` };
      }
    });
  },

  async register(name, email, password) {
    return safeFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    }, async () => {
      const users = mockStore.getUsers();
      const normEmail = email.toLowerCase().trim();
      if (users.find(u => u.email.toLowerCase() === normEmail && u.isVerified !== 0)) {
        return { success: false, message: 'An account with this email already exists.' };
      }
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const newUser = {
        id: users.length + 1,
        name: name.trim(),
        email: normEmail,
        password,
        role: 'USER',
        isVerified: 0,
        otpCode,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      mockStore.setUsers(users);

      return { 
        success: true, 
        requiresOtp: true, 
        email: normEmail, 
        otpCode, 
        message: `A 6-digit verification code (${otpCode}) has been sent to ${normEmail}` 
      };
    });
  },

  async verifyOtp(email, otpCode) {
    return safeFetch('/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode })
    }, async () => {
      const users = mockStore.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user) return { success: false, message: 'User account not found.' };
      if (user.otpCode && user.otpCode !== otpCode.trim()) {
        return { success: false, message: 'Invalid 6-digit OTP code.' };
      }
      user.isVerified = 1;
      mockStore.setUsers(users);

      const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
      const mockToken = `mock-token-${btoa(JSON.stringify(userData))}`;
      localStorage.setItem('jalgaon_airline_current_user', JSON.stringify(userData));

      return { success: true, message: 'Email verified successfully! Account activated.', user: userData, token: mockToken };
    });
  },

  async resendOtp(email) {
    return safeFetch('/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }, async () => {
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      return { success: true, otpCode: newOtp, message: `New verification OTP (${newOtp}) sent to ${email}` };
    });
  },


  async getMe() {
    return safeFetch('/auth/me', {
      headers: { ...getAuthHeader() }
    }, async () => {
      const user = getStoredUser();
      if (user) return { success: true, user };
      return { success: false, message: 'Not authenticated' };
    });
  },

  // Airports & Distance
  async getAirports() {
    return safeFetch('/airports', {}, async () => {
      return { success: true, airports: DEFAULT_AIRPORTS };
    });
  },

  async calculateDistance(source, destination) {
    return safeFetch('/calculate-distance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, destination })
    }, async () => {
      // Basic distance estimation fallback
      return { success: true, distance: 450 };
    });
  },

  // Pricing & System Config
  async getPricingConfig() {
    return safeFetch('/pricing/config', {}, async () => {
      return { success: true, config: mockStore.getConfig() };
    });
  },

  async updatePricingConfig(configData) {
    return safeFetch('/admin/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(configData)
    }, async () => {
      mockStore.setConfig(configData);
      return { success: true, message: 'Pricing updated successfully', config: configData };
    });
  },

  async getPricingPreview(previewParams) {
    return safeFetch('/pricing/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(previewParams)
    }, async () => {
      const { distanceKm = 400, basePrice = 1000, pricePerKm = 5, fuelPricePerLiter = 100, fuelConsumptionPerKm = 0.05, serviceCharge = 200, taxPercentage = 5 } = previewParams;
      const distanceFare = distanceKm * pricePerKm;
      const fuelCost = distanceKm * fuelConsumptionPerKm * fuelPricePerLiter;
      const subtotal = basePrice + distanceFare + fuelCost + serviceCharge;
      const tax = (subtotal * taxPercentage) / 100;
      const finalPrice = Math.round(subtotal + tax);
      return {
        success: true,
        preview: { basePrice, distanceFare, fuelCost, serviceCharge, tax, finalPrice }
      };
    });
  },

  // Admin Flights
  async getAdminFlights() {
    return safeFetch('/admin/flights', {
      headers: { ...getAuthHeader() }
    }, async () => {
      return { success: true, flights: mockStore.getFlights() };
    });
  },

  async addFlight(flightData) {
    return safeFetch('/admin/flights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(flightData)
    }, async () => {
      const flights = mockStore.getFlights();
      const newFlight = {
        id: Date.now(),
        ...flightData,
        availableSeats: Number(flightData.totalSeats),
        totalSeats: Number(flightData.totalSeats),
        distance: Number(flightData.distance) || 450,
        calculatedPrice: Number(flightData.calculatedPrice) || 5000,
        status: flightData.status || 'Scheduled',
        fuelConsumedLiters: Math.round((Number(flightData.distance) || 450) * 0.05),
        totalEstimatedCo2Kg: Math.round((Number(flightData.distance) || 450) * 0.05 * 2.52),
        carbonMetrics: {
          fuelConsumedLiters: Math.round((Number(flightData.distance) || 450) * 0.05),
          totalCo2Kg: Math.round((Number(flightData.distance) || 450) * 0.05 * 2.52),
          co2PerPaxKg: 0.72,
          rating: 'A'
        }
      };
      flights.unshift(newFlight);
      mockStore.setFlights(flights);
      return { success: true, message: 'Flight successfully created.', flight: newFlight };
    });
  },

  async updateFlight(id, flightData) {
    return safeFetch(`/admin/flights/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(flightData)
    }, async () => {
      const flights = mockStore.getFlights();
      const idx = flights.findIndex(f => f.id === Number(id) || f.id === id);
      if (idx !== -1) {
        flights[idx] = { ...flights[idx], ...flightData };
        mockStore.setFlights(flights);
        return { success: true, message: 'Flight updated successfully.', flight: flights[idx] };
      }
      return { success: false, message: 'Flight not found' };
    });
  },

  async updateFlightStatus(id, status) {
    return safeFetch(`/admin/flights/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ status })
    }, async () => {
      const flights = mockStore.getFlights();
      const flight = flights.find(f => f.id === Number(id) || f.id === id);
      if (flight) {
        flight.status = status;
        mockStore.setFlights(flights);
        return { success: true, message: `Flight status updated to ${status}` };
      }
      return { success: false, message: 'Flight not found' };
    });
  },

  async applyAiPrice(id, recommendedPrice) {
    return safeFetch(`/admin/flights/${id}/apply-ai-price`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ recommendedPrice })
    }, async () => {
      const flights = mockStore.getFlights();
      const flight = flights.find(f => f.id === Number(id) || f.id === id);
      if (flight) {
        flight.calculatedPrice = Number(recommendedPrice);
        mockStore.setFlights(flights);
        return { success: true, message: `Dynamic AI price (₹${Number(recommendedPrice).toLocaleString()}) successfully applied.` };
      }
      return { success: false, message: 'Flight not found' };
    });
  },

  async deleteFlight(id) {
    return safeFetch(`/admin/flights/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    }, async () => {
      let flights = mockStore.getFlights();
      flights = flights.filter(f => f.id !== Number(id) && f.id !== id);
      mockStore.setFlights(flights);
      return { success: true, message: 'Flight deleted successfully.' };
    });
  },

  async getAdminStats() {
    return safeFetch('/admin/stats', {
      headers: { ...getAuthHeader() }
    }, async () => {
      const flights = mockStore.getFlights();
      const bookings = mockStore.getBookings();
      const users = mockStore.getUsers();
      const tickets = mockStore.getTickets();
      const totalRev = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const totalSeats = flights.reduce((sum, f) => sum + (f.totalSeats || 0), 0);
      const availSeats = flights.reduce((sum, f) => sum + (f.availableSeats || 0), 0);
      const bookedSeats = totalSeats - availSeats;
      const totalCo2 = flights.reduce((sum, f) => sum + (f.totalEstimatedCo2Kg || 0), 0);

      return {
        success: true,
        stats: {
          totalFlights: flights.length,
          activeFlights: flights.filter(f => f.status !== 'Cancelled').length,
          totalUsers: users.filter(u => u.role === 'USER').length,
          totalBookings: bookings.length,
          totalTickets: tickets.length,
          revenue: totalRev,
          availableSeats: availSeats,
          totalEstimatedCo2Kg: totalCo2,
          totalEstimatedCo2Tonnes: parseFloat((totalCo2 / 1000).toFixed(2)),
          avgOccupancy: totalSeats > 0 ? parseFloat(((bookedSeats / totalSeats) * 100).toFixed(1)) : 0
        }
      };
    });
  },

  async getAdminBookings() {
    return safeFetch('/admin/bookings', {
      headers: { ...getAuthHeader() }
    }, async () => {
      return { success: true, bookings: mockStore.getBookings() };
    });
  },

  async getAdminUsers() {
    return safeFetch('/admin/users', {
      headers: { ...getAuthHeader() }
    }, async () => {
      return { success: true, users: mockStore.getUsers() };
    });
  },

  async getAdminTickets() {
    return safeFetch('/admin/tickets', {
      headers: { ...getAuthHeader() }
    }, async () => {
      return { success: true, tickets: mockStore.getTickets() };
    });
  },

  // Crew Staff & Pilot Management
  async getCrewMembers() {
    return safeFetch('/admin/crew', {
      headers: { ...getAuthHeader() }
    }, async () => {
      return { success: true, crew: mockStore.getCrew() };
    });
  },

  async addCrewMember(crewData) {
    return safeFetch('/admin/crew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(crewData)
    }, async () => {
      const crew = mockStore.getCrew();
      const newMember = {
        id: Date.now(),
        ...crewData,
        employeeId: crewData.employeeId.toUpperCase(),
        status: crewData.status || 'Active',
        createdAt: new Date().toISOString()
      };
      crew.unshift(newMember);
      mockStore.setCrew(crew);
      return { success: true, message: 'Crew member added successfully.', crew: newMember };
    });
  },

  async updateCrewMember(id, crewData) {
    return safeFetch(`/admin/crew/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(crewData)
    }, async () => {
      const crew = mockStore.getCrew();
      const idx = crew.findIndex(c => c.id === Number(id) || c.id === id);
      if (idx !== -1) {
        crew[idx] = { ...crew[idx], ...crewData };
        mockStore.setCrew(crew);
        return { success: true, message: 'Crew member updated successfully.', crew: crew[idx] };
      }
      return { success: false, message: 'Crew member not found' };
    });
  },

  async deleteCrewMember(id) {
    return safeFetch(`/admin/crew/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    }, async () => {
      let crew = mockStore.getCrew();
      crew = crew.filter(c => c.id !== Number(id) && c.id !== id);
      mockStore.setCrew(crew);
      return { success: true, message: 'Crew member removed successfully.' };
    });
  },

  async getFlightCrew(flightId) {
    return safeFetch(`/admin/flights/${flightId}/crew`, {
      headers: { ...getAuthHeader() }
    }, async () => {
      const assignments = mockStore.getCrewAssignments().filter(a => a.flightId === Number(flightId) || a.flightId === flightId);
      const crew = mockStore.getCrew();
      const assignedCrew = assignments.map(a => {
        const c = crew.find(member => member.id === a.crewId);
        return {
          assignmentId: a.id,
          assignedRole: a.assignedRole,
          crewId: a.crewId,
          ...c
        };
      }).filter(item => item.name);
      return { success: true, assignedCrew };
    });
  },

  async assignCrewToFlight(flightId, crewId, assignedRole) {
    return safeFetch(`/admin/flights/${flightId}/crew`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ crewId, assignedRole })
    }, async () => {
      const assignments = mockStore.getCrewAssignments();
      const numFlightId = Number(flightId);
      const numCrewId = Number(crewId);

      const exists = assignments.find(a => a.flightId === numFlightId && a.crewId === numCrewId);
      if (exists) {
        return { success: false, message: 'Crew member already assigned to this flight.' };
      }

      const crewMember = mockStore.getCrew().find(c => c.id === numCrewId);
      const newAssignment = {
        id: Date.now(),
        flightId: numFlightId,
        crewId: numCrewId,
        assignedRole: assignedRole || (crewMember ? crewMember.role : 'Crew')
      };

      assignments.push(newAssignment);
      mockStore.setCrewAssignments(assignments);
      return { success: true, message: `${crewMember ? crewMember.name : 'Crew member'} assigned to flight.` };
    });
  },

  async unassignCrewFromFlight(flightId, crewId) {
    return safeFetch(`/admin/flights/${flightId}/crew/${crewId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    }, async () => {
      let assignments = mockStore.getCrewAssignments();
      assignments = assignments.filter(a => !(a.flightId === Number(flightId) && a.crewId === Number(crewId)));
      mockStore.setCrewAssignments(assignments);
      return { success: true, message: 'Crew member unassigned from flight.' };
    });
  },

  async getCrewAssignments() {
    return safeFetch('/admin/crew/assignments', {
      headers: { ...getAuthHeader() }
    }, async () => {
      const assignments = mockStore.getCrewAssignments();
      const flights = mockStore.getFlights();
      const crew = mockStore.getCrew();

      const result = assignments.map(a => {
        const f = flights.find(fl => fl.id === a.flightId);
        const c = crew.find(cm => cm.id === a.crewId);
        return {
          flightId: a.flightId,
          flightNumber: f ? f.flightNumber : 'FL-000',
          source: f ? f.source : '',
          destination: f ? f.destination : '',
          departureDate: f ? f.departureDate : '',
          departureTime: f ? f.departureTime : '',
          crewId: a.crewId,
          crewName: c ? c.name : 'Unknown Crew',
          crewRole: c ? c.role : 'Crew',
          crewGender: c ? c.gender : 'Female',
          employeeId: c ? c.employeeId : ''
        };
      });

      return { success: true, assignments: result };
    });
  },

  // Weather Intelligence API
  async getWeather() {
    return safeFetch('/weather', {}, async () => {
      const weather = mockStore.getWeather();
      return { success: true, weather };
    });
  },

  async getAirportWeather(code) {
    return safeFetch(`/weather/${code}`, {}, async () => {
      const weather = mockStore.getWeather();
      const item = weather.find(w => w.airportCode === code.toUpperCase());
      if (item) return { success: true, weather: item };
      return { success: false, message: 'Airport weather not found' };
    });
  },

  async updateAirportWeather(code, data) {
    return safeFetch(`/admin/weather/${code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    }, async () => {
      const weather = mockStore.getWeather();
      const index = weather.findIndex(w => w.airportCode === code.toUpperCase());
      if (index !== -1) {
        weather[index] = { ...weather[index], ...data };
        mockStore.setWeather(weather);
        return { success: true, message: `Weather updated for ${code}`, weather: weather[index] };
      }
      return { success: false, message: 'Airport code not found' };
    });
  },


  // AI & Advanced Analytics
  async getAiPricingRecommendations() {
    return safeFetch('/admin/ai/pricing-recommendations', {
      headers: { ...getAuthHeader() }
    }, async () => {
      const flights = mockStore.getFlights();
      const recommendations = flights.map(f => {
        const booked = f.totalSeats - f.availableSeats;
        const occ = Math.round((booked / f.totalSeats) * 100);
        const isHigh = occ > 70;
        const diff = isHigh ? Math.round(f.calculatedPrice * 0.12) : -Math.round(f.calculatedPrice * 0.08);
        return {
          flightId: f.id,
          flightNumber: f.flightNumber,
          airline: f.airline,
          aircraft: f.aircraft,
          route: `${f.source} → ${f.destination}`,
          totalSeats: f.totalSeats,
          bookedSeats: booked,
          availableSeats: f.availableSeats,
          occupancyPercent: occ,
          currentPrice: f.calculatedPrice,
          recommendedPrice: f.calculatedPrice + diff,
          priceDifference: diff,
          adjustmentPercent: isHigh ? 12 : -8,
          demandLevel: isHigh ? 'High Demand' : 'Moderate Demand',
          reason: isHigh ? `High occupancy (${occ}%) observed. Surge pricing recommended.` : `Stimulate bookings with a dynamic fare adjustment.`
        };
      });
      return { success: true, recommendations };
    });
  },

  async getAiDemandForecast() {
    return safeFetch('/admin/ai/demand-forecast', {
      headers: { ...getAuthHeader() }
    }, async () => {
      const flights = mockStore.getFlights();
      return {
        success: true,
        hasSufficientData: true,
        message: 'Forecasting active routes using current booking load factors.',
        forecasts: flights.map(f => ({
          flightId: f.id,
          flightNumber: f.flightNumber,
          route: `${f.source} → ${f.destination}`,
          occupancyPercent: Math.round(((f.totalSeats - f.availableSeats) / f.totalSeats) * 100),
          forecastedDemand: '78% - 85% Load Factor',
          recommendation: 'Maintain capacity on this route.',
          riskLevel: 'Low'
        }))
      };
    });
  },

  async getRevenueAnalytics(period = 'all') {
    return safeFetch(`/admin/analytics/revenue?period=${period}`, {
      headers: { ...getAuthHeader() }
    }, async () => {
      return {
        success: true,
        analytics: {
          period,
          totalRevenue: 285400,
          totalBookings: 18,
          avgTicketPrice: 6200,
          dailyBreakdown: [
            { day: 'Mon', revenue: 34000, bookings: 5 },
            { day: 'Tue', revenue: 42000, bookings: 6 },
            { day: 'Wed', revenue: 39000, bookings: 4 },
            { day: 'Thu', revenue: 52000, bookings: 7 },
            { day: 'Fri', revenue: 68000, bookings: 9 },
            { day: 'Sat', revenue: 74000, bookings: 11 },
            { day: 'Sun', revenue: 61000, bookings: 8 }
          ],
          flightsPerformance: mockStore.getFlights().map(f => ({
            id: f.id,
            flightNumber: f.flightNumber,
            route: `${f.source} → ${f.destination}`,
            revenue: (f.totalSeats - f.availableSeats) * f.calculatedPrice,
            seatsSold: f.totalSeats - f.availableSeats,
            loadFactor: Math.round(((f.totalSeats - f.availableSeats) / f.totalSeats) * 100)
          }))
        }
      };
    });
  },

  async getSustainabilityAnalytics() {
    return safeFetch('/admin/analytics/sustainability', {
      headers: { ...getAuthHeader() }
    }, async () => {
      const flights = mockStore.getFlights();
      const totalCo2 = flights.reduce((sum, f) => sum + (f.totalEstimatedCo2Kg || 0), 0);
      return {
        success: true,
        sustainability: {
          totalCo2Kg: totalCo2,
          totalCo2Tonnes: parseFloat((totalCo2 / 1000).toFixed(2)),
          esgRating: 'A-',
          safAdoptionRate: 15.2,
          co2OffsetCost: Math.round(totalCo2 * 1.8),
          fleetBreakdown: [
            { aircraft: 'ATR 72-600', flights: 2, avgCo2Kg: 58.2 },
            { aircraft: 'Airbus A320neo', flights: 1, avgCo2Kg: 123.5 }
          ]
        }
      };
    });
  },

  async getAiOperationalInsights() {
    return safeFetch('/admin/ai/operational-insights', {
      headers: { ...getAuthHeader() }
    }, async () => {
      return {
        success: true,
        insights: [
          {
            type: 'OPTIMIZATION',
            title: 'Jalgaon (JLG) - Mumbai (BOM) High Demand',
            description: 'Morning schedule shows 94% seat interest. Consider opening an additional afternoon slot.',
            impact: '+₹42,000 potential revenue'
          },
          {
            type: 'SUSTAINABILITY',
            title: 'Fuel Efficiency Benchmark',
            description: 'Turboprop ATR 72-600 fleet emitting 35% less CO2 per passenger compared to regional jets on short hops.',
            impact: 'ESG Score A+'
          }
        ]
      };
    });
  },

  async askAiAssistant(query) {
    return safeFetch('/admin/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ query })
    }, async () => {
      const q = query.toLowerCase();
      let response = "I am your Jalgaon Airline AI Assistant. I can assist with fleet occupancy, dynamic tariffs, fuel telemetry, and passenger trends.";
      if (q.includes('flight') || q.includes('route')) {
        response = `Currently active routes from Jalgaon (JLG) include direct regional connections to Mumbai (BOM), Pune (PNQ), and Delhi (DEL) with steady occupancy.`;
      } else if (q.includes('revenue') || q.includes('price')) {
        response = `Our distance-based algorithm calculates tariffs using base fare + per-km distance + aviation fuel rates + standard taxes.`;
      } else if (q.includes('carbon') || q.includes('co2')) {
        response = `Eco-telemetry tracks fuel burn with a standard 2.52 kg CO2 per liter factor. Regional turboprop flights are operating at peak sustainability.`;
      }
      return { success: true, answer: response };
    });
  },

  async getCombinedFlightAnalytics() {
    return safeFetch('/admin/analytics/flights-combined', {
      headers: { ...getAuthHeader() }
    }, async () => {
      const flights = mockStore.getFlights();
      return {
        success: true,
        flights: flights.map(f => ({
          id: f.id,
          flightNumber: f.flightNumber,
          route: `${f.source} → ${f.destination}`,
          revenue: (f.totalSeats - f.availableSeats) * f.calculatedPrice,
          seatsSold: f.totalSeats - f.availableSeats,
          loadFactor: Math.round(((f.totalSeats - f.availableSeats) / f.totalSeats) * 100),
          aircraft: f.aircraft,
          status: f.status
        }))
      };
    });
  },

  // User Flights & Booking
  async searchFlights({ from, to, date, passengers }) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (date) params.append('date', date);
    if (passengers) params.append('passengers', passengers);

    return safeFetch(`/flights/search?${params.toString()}`, {}, async () => {
      let flights = mockStore.getFlights().filter(f => f.status !== 'Cancelled');
      if (from) {
        flights = flights.filter(f => f.source.toLowerCase().includes(from.toLowerCase()));
      }
      if (to) {
        flights = flights.filter(f => f.destination.toLowerCase().includes(to.toLowerCase()));
      }
      if (date) {
        flights = flights.filter(f => f.departureDate === date);
      }
      return { success: true, flights };
    });
  },

  async getFlight(id) {
    return safeFetch(`/flights/${id}`, {}, async () => {
      const flight = mockStore.getFlights().find(f => f.id === Number(id) || f.id === id);
      if (flight) return { success: true, flight };
      return { success: false, message: 'Flight not found' };
    });
  },

  async createBooking(flightId, passengers, travelClass = 'Economy') {
    return safeFetch('/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ flightId, passengers, travelClass })
    }, async () => {
      const flights = mockStore.getFlights();
      const flight = flights.find(f => f.id === Number(flightId) || f.id === flightId);
      if (!flight) return { success: false, message: 'Flight not found' };

      const user = getStoredUser() || { id: 1, email: 'passenger@example.com' };
      const passengerCount = passengers.length;
      if (flight.availableSeats < passengerCount) {
        return { success: false, message: `Only ${flight.availableSeats} seat(s) available.` };
      }

      flight.availableSeats -= passengerCount;
      mockStore.setFlights(flights);

      const classMultipliers = { 'Economy': 1.0, 'Business': 1.5, 'First Class': 2.0 };
      const multiplier = classMultipliers[travelClass] || 1.0;
      const baseFare = flight.calculatedPrice || flight.price || 2500;
      const pricePerPassenger = Math.round(baseFare * multiplier);
      const totalAmount = pricePerPassenger * passengerCount;

      const bookingId = `BK${Date.now().toString().slice(-8)}`;
      const pnr = `PNR${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const ticketId = `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const assignedPassengers = passengers.map((p, idx) => ({
        ...p,
        seatNumber: `${Math.floor(idx / 6) + 1}${['A','B','C','D','E','F'][idx % 6]}`
      }));

      const newBooking = {
        id: Date.now(),
        bookingId,
        userId: user.id,
        flightId: flight.id,
        travelClass,
        passengerCount,
        pricePerPassenger,
        totalAmount,
        bookingDate: new Date().toISOString(),
        status: 'CONFIRMED',
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        aircraft: flight.aircraft,
        source: flight.source,
        destination: flight.destination,
        departureDate: flight.departureDate,
        departureTime: flight.departureTime,
        arrivalDate: flight.arrivalDate,
        arrivalTime: flight.arrivalTime,
        flightStatus: flight.status,
        ticketId,
        pnr,
        passengers: assignedPassengers
      };

      const newTicket = {
        id: Date.now(),
        ticketId,
        bookingId,
        pnr,
        userId: user.id,
        flightId: flight.id,
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        aircraft: flight.aircraft,
        source: flight.source,
        destination: flight.destination,
        departureDate: flight.departureDate,
        departureTime: flight.departureTime,
        arrivalDate: flight.arrivalDate,
        arrivalTime: flight.arrivalTime,
        passengerCount,
        passengers: assignedPassengers,
        pricePerPassenger,
        totalAmount,
        estimatedCo2PerPaxKg: 0.75,
        status: 'CONFIRMED',
        issueDate: new Date().toISOString()
      };

      const bookings = mockStore.getBookings();
      bookings.unshift(newBooking);
      mockStore.setBookings(bookings);

      const tickets = mockStore.getTickets();
      tickets.unshift(newTicket);
      mockStore.setTickets(tickets);

      return {
        success: true,
        message: 'Booking successfully confirmed! Your ticket has been generated.',
        bookingId,
        ticket: newTicket
      };
    });
  },

  async getMyBookings() {
    return safeFetch('/bookings/my', {
      headers: { ...getAuthHeader() }
    }, async () => {
      const user = getStoredUser();
      const bookings = mockStore.getBookings();
      const userBookings = user ? bookings.filter(b => b.userId === user.id) : bookings;
      return { success: true, bookings: userBookings };
    });
  },

  async getMyTickets() {
    return safeFetch('/tickets/my', {
      headers: { ...getAuthHeader() }
    }, async () => {
      const user = getStoredUser();
      const tickets = mockStore.getTickets();
      const userTickets = user ? tickets.filter(t => t.userId === user.id) : tickets;
      return { success: true, tickets: userTickets };
    });
  },

  async getTicket(id) {
    return safeFetch(`/tickets/${id}`, {
      headers: { ...getAuthHeader() }
    }, async () => {
      const ticket = mockStore.getTickets().find(t => t.ticketId === id || t.bookingId === id || t.pnr === id);
      if (ticket) return { success: true, ticket };
      return { success: false, message: 'Ticket not found' };
    });
  }
};
