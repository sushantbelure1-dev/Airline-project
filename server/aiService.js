import db from './db.js';
import { calculateCarbonEmissions } from './carbonService.js';

/**
 * AI-Powered Revenue, Operations & Sustainability Analytics Engine
 * Responsibilities:
 * - Dynamic Pricing Recommendations (Accept / Ignore)
 * - Demand Forecasting with low-data fallbacks
 * - Revenue & Route Performance Analysis
 * - Fleet / Aircraft Efficiency Telemetry
 * - Sustainability & Carbon Optimization Insights
 * - Natural Language Grounded Admin AI Assistant
 */
export class AIService {
  /**
   * 1. Dynamic Pricing Recommendations for all active flights
   */
  static getDynamicPricingRecommendations() {
    const config = db.prepare('SELECT * FROM pricing_config WHERE id = 1').get();
    const flights = db.prepare("SELECT * FROM flights WHERE status != 'CANCELLED'").all();

    const recommendations = [];

    for (const flight of flights) {
      const bookedSeats = flight.totalSeats - flight.availableSeats;
      const occupancyPercent = parseFloat(((bookedSeats / flight.totalSeats) * 100).toFixed(1));
      
      // Recent booking velocity (bookings made in last 48 hours for this flight)
      const recentBookingsCount = db.prepare(`
        SELECT count(*) as count FROM bookings 
        WHERE flightId = ? AND bookingDate >= datetime('now', '-2 days')
      `).get(flight.id).count;

      let demandLevel = 'Medium Demand';
      let suggestedPrice = flight.calculatedPrice;
      let reason = 'Steady booking trend observed. Current pricing reflects balanced capacity.';
      let adjustmentPercent = 0;

      if (occupancyPercent >= (config.highDemandOccupancyThreshold || 75) || recentBookingsCount >= 4) {
        demandLevel = 'High Demand';
        adjustmentPercent = config.surgeAdjustmentPercent || 12;
        suggestedPrice = Math.round(flight.calculatedPrice * (1 + adjustmentPercent / 100));
        reason = `High seat occupancy (${occupancyPercent}%) and strong booking velocity (+${recentBookingsCount} recently). Recommend surge adjustment.`;
      } else if (occupancyPercent <= (config.lowDemandOccupancyThreshold || 40) && flight.totalSeats > 20) {
        demandLevel = 'Low Demand';
        adjustmentPercent = -(config.discountAdjustmentPercent || 10);
        suggestedPrice = Math.round(flight.calculatedPrice * (1 + adjustmentPercent / 100));
        reason = `Low seat occupancy (${occupancyPercent}%) with available capacity. Recommend incentive discount to stimulate demand.`;
      }

      recommendations.push({
        flightId: flight.id,
        flightNumber: flight.flightNumber,
        airline: flight.airline,
        aircraft: flight.aircraft,
        route: `${flight.source} → ${flight.destination}`,
        totalSeats: flight.totalSeats,
        bookedSeats,
        availableSeats: flight.availableSeats,
        occupancyPercent,
        currentPrice: flight.calculatedPrice,
        recommendedPrice: suggestedPrice,
        priceDifference: suggestedPrice - flight.calculatedPrice,
        adjustmentPercent,
        demandLevel,
        reason,
        departureDate: flight.departureDate
      });
    }

    return recommendations;
  }

  /**
   * 2. Demand Forecasting with strict historical data sufficiency checks
   */
  static getDemandForecast() {
    const config = db.prepare('SELECT * FROM pricing_config WHERE id = 1').get();
    const totalBookingsCount = db.prepare('SELECT count(*) as count FROM bookings').get().count;
    const minRequired = config.minHistoricalBookingsRequired || 3;

    if (totalBookingsCount < minRequired) {
      return {
        hasSufficientData: false,
        message: `Insufficient historical data for reliable prediction (${totalBookingsCount}/${minRequired} confirmed bookings recorded). As passengers book flights, machine learning demand trends will automatically generate here.`,
        forecasts: []
      };
    }

    // Retrieve active and upcoming flights to forecast
    const flights = db.prepare("SELECT * FROM flights WHERE status != 'CANCELLED' ORDER BY departureDate ASC").all();
    const forecasts = [];

    // Analyze route-level booking velocity from database
    for (const f of flights) {
      const historicalRouteBookings = db.prepare(`
        SELECT count(*) as count, sum(passengerCount) as pax, avg(pricePerPassenger) as avgPrice 
        FROM bookings b JOIN flights fl ON b.flightId = fl.id 
        WHERE fl.source = ? AND fl.destination = ?
      `).get(f.source, f.destination);

      const bookedSeats = f.totalSeats - f.availableSeats;
      const currentOccupancy = (bookedSeats / f.totalSeats) * 100;

      let expectedDemand = 'Medium Demand';
      let expectedOccupancy = Math.min(100, Math.round(currentOccupancy + 15));

      if (historicalRouteBookings.count >= 2 || currentOccupancy >= 60) {
        expectedDemand = 'High Demand';
        expectedOccupancy = Math.min(100, Math.round(currentOccupancy + 25));
      } else if (currentOccupancy < 25) {
        expectedDemand = 'Low Demand';
        expectedOccupancy = Math.max(bookedSeats, Math.round(f.totalSeats * 0.35));
      }

      const expectedBookings = Math.round((expectedOccupancy / 100) * f.totalSeats);
      const expectedRevenue = expectedBookings * f.calculatedPrice;

      forecasts.push({
        flightId: f.id,
        flightNumber: f.flightNumber,
        route: `${f.source} → ${f.destination}`,
        departureDate: f.departureDate,
        currentBookings: bookedSeats,
        expectedBookings,
        expectedOccupancy,
        expectedRevenue,
        demandLevel: expectedDemand
      });
    }

    return {
      hasSufficientData: true,
      message: 'Demand forecasts generated using historical booking velocity and seat fill rates.',
      forecasts
    };
  }

  /**
   * 3. Revenue Analytics & KPI Calculations with Time Filter
   */
  static getRevenueAnalytics(filterPeriod = 'all') {
    let dateFilter = '';
    if (filterPeriod === 'today') {
      dateFilter = "AND date(bookingDate) = date('now')";
    } else if (filterPeriod === '7days') {
      dateFilter = "AND bookingDate >= datetime('now', '-7 days')";
    } else if (filterPeriod === '30days') {
      dateFilter = "AND bookingDate >= datetime('now', '-30 days')";
    } else if (filterPeriod === '3months') {
      dateFilter = "AND bookingDate >= datetime('now', '-90 days')";
    }

    const totalRevRow = db.prepare(`SELECT sum(totalAmount) as rev, count(*) as count, sum(passengerCount) as pax FROM bookings WHERE status = 'CONFIRMED' ${dateFilter}`).get();
    const todayRevRow = db.prepare("SELECT sum(totalAmount) as rev FROM bookings WHERE status = 'CONFIRMED' AND date(bookingDate) = date('now')").get();
    const monthRevRow = db.prepare("SELECT sum(totalAmount) as rev FROM bookings WHERE status = 'CONFIRMED' AND bookingDate >= datetime('now', '-30 days')").get();

    const totalRev = totalRevRow.rev || 0;
    const todayRev = todayRevRow.rev || 0;
    const monthlyRev = monthRevRow.rev || 0;
    const totalBookings = totalRevRow.count || 0;
    const totalPax = totalRevRow.pax || 0;

    const avgTicketPrice = totalPax > 0 ? Math.round(totalRev / totalPax) : 0;
    const flightsCount = db.prepare("SELECT count(*) as count FROM flights WHERE status != 'CANCELLED'").get().count;
    const avgRevPerFlight = flightsCount > 0 ? Math.round(totalRev / flightsCount) : 0;
    const revPerPax = totalPax > 0 ? Math.round(totalRev / totalPax) : 0;

    // Occupancy
    const seatAgg = db.prepare("SELECT sum(totalSeats) as total, sum(availableSeats) as avail FROM flights WHERE status != 'CANCELLED'").get();
    const totalSeatsAll = seatAgg.total || 0;
    const bookedSeatsAll = totalSeatsAll - (seatAgg.avail || 0);
    const avgOccupancy = totalSeatsAll > 0 ? parseFloat(((bookedSeatsAll / totalSeatsAll) * 100).toFixed(1)) : 0;

    // Revenue by Route
    const routeRevenue = db.prepare(`
      SELECT f.source || ' → ' || f.destination as route,
             count(b.id) as bookingsCount,
             sum(b.passengerCount) as passengers,
             sum(b.totalAmount) as revenue,
             avg(f.calculatedPrice) as avgFare
      FROM bookings b
      JOIN flights f ON b.flightId = f.id
      WHERE b.status = 'CONFIRMED' ${dateFilter}
      GROUP BY f.source, f.destination
      ORDER BY revenue DESC
    `).all();

    // Revenue over time (grouped by day)
    const revenueOverTime = db.prepare(`
      SELECT date(bookingDate) as date, sum(totalAmount) as revenue, sum(passengerCount) as bookings
      FROM bookings
      WHERE status = 'CONFIRMED' ${dateFilter}
      GROUP BY date(bookingDate)
      ORDER BY date ASC
    `).all();

    // Flight Performance List
    const flightsPerformance = db.prepare(`
      SELECT f.id, f.flightNumber, f.airline, f.aircraft, f.source, f.destination, f.distance,
             f.totalSeats, f.availableSeats, f.calculatedPrice, f.fuelConsumedLiters, f.totalEstimatedCo2Kg,
             f.status,
             COALESCE(sum(b.totalAmount), 0) as revenue,
             COALESCE(sum(b.passengerCount), 0) as bookedPax,
             count(b.id) as bookingsCount
      FROM flights f
      LEFT JOIN bookings b ON f.id = b.flightId AND b.status = 'CONFIRMED'
      GROUP BY f.id
      ORDER BY revenue DESC
    `).all();

    for (const fp of flightsPerformance) {
      fp.occupancy = fp.totalSeats > 0 ? parseFloat((((fp.totalSeats - fp.availableSeats) / fp.totalSeats) * 100).toFixed(1)) : 0;
      fp.co2PerPax = fp.bookedPax > 0 ? parseFloat((fp.totalEstimatedCo2Kg / fp.bookedPax).toFixed(1)) : parseFloat((fp.totalEstimatedCo2Kg / fp.totalSeats).toFixed(1));
    }

    return {
      kpis: {
        totalRevenue: totalRev,
        todayRevenue: todayRev,
        monthlyRevenue: monthlyRev,
        totalBookings,
        totalPassengers: totalPax,
        avgTicketPrice,
        avgRevPerFlight,
        revPerPax,
        avgOccupancy
      },
      routeRevenue,
      revenueOverTime,
      flightsPerformance
    };
  }

  /**
   * 4. Carbon & Sustainability Dashboard Analytics
   */
  static getSustainabilityAnalytics() {
    const config = db.prepare('SELECT * FROM pricing_config WHERE id = 1').get();

    // Sum estimated CO2 across all flights
    const fleetTotals = db.prepare(`
      SELECT sum(fuelConsumedLiters) as totalFuel, sum(totalEstimatedCo2Kg) as totalCo2,
             sum(totalSeats) as totalSeats, sum(availableSeats) as availSeats
      FROM flights WHERE status != 'CANCELLED'
    `).get();

    const totalCo2Kg = fleetTotals.totalCo2 || 0;
    const totalCo2Tonnes = parseFloat((totalCo2Kg / 1000).toFixed(2));
    const totalFuelLiters = fleetTotals.totalFuel || 0;

    // Total confirmed passengers across all flights
    const paxCount = db.prepare("SELECT sum(passengerCount) as count FROM bookings WHERE status = 'CONFIRMED'").get().count || 0;
    const avgCo2PerPaxKg = paxCount > 0 ? parseFloat((totalCo2Kg / paxCount).toFixed(1)) : (totalCo2Kg > 0 ? 55.4 : 0);

    // Emissions by route
    const emissionsByRoute = db.prepare(`
      SELECT f.source || ' → ' || f.destination as route,
             count(f.id) as flightCount,
             sum(f.distance) as totalDistance,
             sum(f.fuelConsumedLiters) as fuelLiters,
             sum(f.totalEstimatedCo2Kg) as co2Kg,
             round(sum(f.totalEstimatedCo2Kg) / 1000.0, 2) as co2Tonnes
      FROM flights f
      WHERE f.status != 'CANCELLED'
      GROUP BY f.source, f.destination
      ORDER BY co2Kg DESC
    `).all();

    // Aircraft efficiency comparison
    const aircraftEfficiency = db.prepare(`
      SELECT f.aircraft,
             count(f.id) as flightsOperated,
             sum(f.distance) as totalKm,
             sum(f.fuelConsumedLiters) as totalFuelLiters,
             sum(f.totalEstimatedCo2Kg) as totalCo2Kg,
             round(avg(f.fuelConsumptionPerKm), 4) as avgFuelBurnPerKm,
             round(sum(f.totalEstimatedCo2Kg) / sum(f.totalSeats), 1) as co2PerCapacitySeat
      FROM flights f
      WHERE f.status != 'CANCELLED'
      GROUP BY f.aircraft
      ORDER BY totalCo2Kg DESC
    `).all();

    return {
      summary: {
        totalCo2Kg,
        totalCo2Tonnes,
        totalFuelLiters,
        avgCo2PerPaxKg,
        emissionFactor: config.co2EmissionFactor,
        emissionFactorUnit: config.emissionFactorUnit,
        treesOffsetEquivalent: Math.ceil(totalCo2Kg / 21)
      },
      emissionsByRoute,
      aircraftEfficiency
    };
  }

  /**
   * 5. AI Operational & Sustainability Insights (Grounded in DB data)
   */
  static getOperationalAndSustainabilityInsights() {
    const insights = [];
    const flights = db.prepare("SELECT * FROM flights WHERE status != 'CANCELLED'").all();

    // Check high & low occupancy flights
    for (const f of flights) {
      const booked = f.totalSeats - f.availableSeats;
      const occ = (booked / f.totalSeats) * 100;

      if (occ >= 85) {
        insights.push({
          type: 'revenue_opportunity',
          category: 'High Occupancy & Demand',
          title: `Flight ${f.flightNumber} Near Full Capacity (${occ.toFixed(0)}%)`,
          message: `Flight ${f.flightNumber} (${f.source} → ${f.destination}) has reached ${booked}/${f.totalSeats} seats. Yield optimization suggests high passenger willingness-to-pay.`,
          flightId: f.id,
          priority: 'high'
        });
      } else if (occ < 30 && f.totalSeats > 30) {
        insights.push({
          type: 'sustainability_alert',
          category: 'Low Occupancy Carbon Intensity',
          title: `Flight ${f.flightNumber} Low Load Factor (${occ.toFixed(0)}%)`,
          message: `Flight ${f.flightNumber} has high estimated emission per passenger (${(f.totalEstimatedCo2Kg / Math.max(1, booked)).toFixed(0)} kg CO2/pax) due to low seat utilization. Consider fare incentive or consolidating schedule.`,
          flightId: f.id,
          priority: 'medium'
        });
      }
    }

    // Aircraft efficiency check
    const aircraftList = db.prepare("SELECT aircraft, avg(fuelConsumptionPerKm) as burn FROM flights GROUP BY aircraft").all();
    if (aircraftList.length > 1) {
      insights.push({
        type: 'operations_efficiency',
        category: 'Fleet Utilization',
        title: 'Fleet Model Fuel Comparison Active',
        message: `Currently operating ${aircraftList.length} distinct aircraft types. Turboprop models (e.g. ATR 72) achieve up to 34% lower fuel burn on sub-500 KM regional corridors compared with narrowbody jets.`,
        priority: 'low'
      });
    }

    return insights;
  }

  /**
   * 6. Admin AI Assistant (Grounded natural-language queries answered with real database data)
   */
  static answerAdminQuery(prompt) {
    const q = (prompt || '').toLowerCase().trim();

    if (!q) {
      return { answer: "Please enter a question regarding flight revenues, occupancy, carbon emissions, or fleet schedules." };
    }

    // Query 1: Highest revenue flight
    if (q.includes('highest revenue') || q.includes('most revenue') || q.includes('top revenue flight')) {
      const best = db.prepare(`
        SELECT f.flightNumber, f.source, f.destination, sum(b.totalAmount) as totalRev, count(b.id) as bookingsCount
        FROM flights f
        JOIN bookings b ON f.id = b.flightId
        WHERE b.status = 'CONFIRMED'
        GROUP BY f.id
        ORDER BY totalRev DESC
        LIMIT 1
      `).get();

      if (best) {
        return {
          answer: `Flight ${best.flightNumber} (${best.source} → ${best.destination}) generated the highest revenue in the database, with Rs ${Number(best.totalRev).toLocaleString()} from ${best.bookingsCount} confirmed bookings.`,
          data: best
        };
      }
      return { answer: "No confirmed passenger bookings recorded yet to determine highest revenue flight." };
    }

    // Query 2: Highest occupancy route
    if (q.includes('highest occupancy') || q.includes('most popular route') || q.includes('best route')) {
      const bestRoute = db.prepare(`
        SELECT f.source || ' → ' || f.destination as route,
               round(avg((f.totalSeats - f.availableSeats) * 100.0 / f.totalSeats), 1) as avgOcc,
               count(f.id) as flightCount
        FROM flights f
        WHERE f.status != 'CANCELLED'
        GROUP BY f.source, f.destination
        ORDER BY avgOcc DESC
        LIMIT 1
      `).get();

      if (bestRoute) {
        return {
          answer: `The route with highest average occupancy is ${bestRoute.route} with ${bestRoute.avgOcc}% average seat fill rate across ${bestRoute.flightCount} scheduled flight(s).`,
          data: bestRoute
        };
      }
      return { answer: "No active flights found to calculate route occupancy." };
    }

    // Query 3: Low occupancy flights
    if (q.includes('low occupancy') || q.includes('empty seats') || q.includes('less than 30%') || q.includes('low demand')) {
      const lowFlights = db.prepare(`
        SELECT flightNumber, source, destination, totalSeats, availableSeats,
               round(((totalSeats - availableSeats) * 100.0 / totalSeats), 1) as occ
        FROM flights
        WHERE status != 'CANCELLED' AND ((totalSeats - availableSeats) * 100.0 / totalSeats) < 50
        ORDER BY occ ASC
      `).all();

      if (lowFlights.length > 0) {
        const flightNames = lowFlights.map(f => `${f.flightNumber} (${f.source} → ${f.destination}: ${f.occ}% occupancy, ${f.availableSeats} open seats)`).join('; ');
        return {
          answer: `Identified ${lowFlights.length} flight(s) with lower seat occupancy: ${flightNames}. AI Dynamic Pricing suggests promotional rate incentives.`,
          data: lowFlights
        };
      }
      return { answer: "All active flights currently exhibit healthy occupancy rates above 50%." };
    }

    // Query 4: Total carbon emission
    if (q.includes('carbon') || q.includes('emission') || q.includes('co2')) {
      const co2Data = db.prepare("SELECT sum(totalEstimatedCo2Kg) as totalCo2, sum(fuelConsumedLiters) as fuel FROM flights WHERE status != 'CANCELLED'").get();
      const paxCount = db.prepare("SELECT sum(passengerCount) as pax FROM bookings WHERE status = 'CONFIRMED'").get().pax || 0;
      const totalKg = co2Data.totalCo2 || 0;
      const perPax = paxCount > 0 ? (totalKg / paxCount).toFixed(1) : (totalKg / 70).toFixed(1);

      return {
        answer: `The total estimated carbon footprint across all scheduled flights is ${totalKg.toLocaleString()} kg CO2 (${(totalKg / 1000).toFixed(2)} Tonnes CO2) from ${(co2Data.fuel || 0).toLocaleString()} liters of jet fuel. Estimated average emission is ~${perPax} kg CO2 per passenger.`,
        data: { totalKg, totalTonnes: totalKg / 1000, totalFuel: co2Data.fuel }
      };
    }

    // Query 5: Aircraft fuel consumption
    if (q.includes('aircraft') || q.includes('fuel consumed') || q.includes('most fuel')) {
      const aircraft = db.prepare(`
        SELECT aircraft, sum(fuelConsumedLiters) as fuel, sum(totalEstimatedCo2Kg) as co2, count(id) as flights
        FROM flights
        WHERE status != 'CANCELLED'
        GROUP BY aircraft
        ORDER BY fuel DESC
      `).all();

      if (aircraft.length > 0) {
        const summary = aircraft.map(a => `${a.aircraft} (${a.fuel.toLocaleString()} L across ${a.flights} flights)`).join(', ');
        return {
          answer: `Fleet fuel consumption by aircraft model: ${summary}. Turboprop aircraft show lowest fuel consumption per nautical mile on regional routes.`,
          data: aircraft
        };
      }
      return { answer: "No active aircraft records found in database." };
    }

    // Query 6: Upcoming or scheduled flights
    if (q.includes('upcoming') || q.includes('scheduled flights') || q.includes('active flights')) {
      const upcoming = db.prepare("SELECT flightNumber, source, destination, departureDate, departureTime, status FROM flights WHERE status != 'CANCELLED' ORDER BY departureDate ASC LIMIT 5").all();
      if (upcoming.length > 0) {
        const list = upcoming.map(f => `${f.flightNumber} (${f.source} → ${f.destination} on ${f.departureDate} at ${f.departureTime} [${f.status}])`).join(', ');
        return {
          answer: `Upcoming scheduled flights: ${list}.`,
          data: upcoming
        };
      }
      return { answer: "No upcoming flights scheduled in database." };
    }

    // Fallback general overview
    const totalRev = db.prepare("SELECT sum(totalAmount) as rev FROM bookings WHERE status = 'CONFIRMED'").get().rev || 0;
    const flightCount = db.prepare("SELECT count(*) as count FROM flights WHERE status != 'CANCELLED'").get().count;
    const bookingCount = db.prepare("SELECT count(*) as count FROM bookings WHERE status = 'CONFIRMED'").get().count;

    return {
      answer: `Jalgaon Airline operational overview: Database currently hosts ${flightCount} active flight route(s), ${bookingCount} confirmed booking(s), and total generated revenue of Rs ${Number(totalRev).toLocaleString()}. You can ask me specific questions regarding top routes, fuel consumption, carbon emissions, or pricing recommendations.`
    };
  }
}
