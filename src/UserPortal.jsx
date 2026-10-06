import React, { useState, useEffect } from 'react';
import { 
  Plane, Search, Calendar, Users, ArrowRight, CheckCircle, 
  Clock, MapPin, Ticket, AlertCircle, Eye, Download, LogOut, User as UserIcon
} from 'lucide-react';
import { api } from './api';
import BookingModal from './BookingModal';
import TicketModal from './TicketModal';

export default function UserPortal({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('search'); // 'dashboard', 'search', 'bookings', 'tickets', 'profile'
  
  // Search parameters
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: '',
    passengers: 1
  });

  const [availableFlights, setAvailableFlights] = useState([]);
  const [airports, setAirports] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  
  const [selectedFlightForBooking, setSelectedFlightForBooking] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchInitiated, setSearchInitiated] = useState(false);

  // Load airports and user records
  useEffect(() => {
    async function init() {
      try {
        const [airportsRes, bookingsRes, ticketsRes] = await Promise.all([
          api.getAirports(),
          api.getMyBookings(),
          api.getMyTickets()
        ]);
        if (airportsRes.success) setAirports(airportsRes.airports);
        if (bookingsRes.success) setMyBookings(bookingsRes.bookings);
        if (ticketsRes.success) setMyTickets(ticketsRes.tickets);
      } catch (err) {
        console.error('User portal init error:', err);
      }
    }
    init();
    handleSearch();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setSearchInitiated(true);
    try {
      const res = await api.searchFlights(searchParams);
      if (res.success) {
        setAvailableFlights(res.flights);
      }
    } catch (err) {
      console.error('Flight search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSuccess = (newTicket) => {
    setSelectedFlightForBooking(null);
    setSelectedTicket(newTicket);
    // Refresh bookings & tickets
    api.getMyBookings().then(res => res.success && setMyBookings(res.bookings));
    api.getMyTickets().then(res => res.success && setMyTickets(res.tickets));
    api.searchFlights(searchParams).then(res => res.success && setAvailableFlights(res.flights));
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 75px)', display: 'flex', flexDirection: 'column' }}>
      {/* User Navigation Header */}
      <div style={{
        background: 'rgba(13, 21, 39, 0.95)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'search', label: 'Search Flights' },
            { id: 'bookings', label: `My Bookings (${myBookings.length})` },
            { id: 'tickets', label: `My Tickets (${myTickets.length})` },
            { id: 'profile', label: 'Profile' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '14px 18px',
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#f43f5e',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <LogOut size={14} /> Logout ({user.name})
        </button>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '28px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        {/* TAB 1: USER DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
                Welcome, {user.name}
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                Jalgaon Airline Passenger Portal • Fast Bookings & Verified Boarding Passes
              </p>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '28px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Available Active Flights</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', marginTop: '8px' }} className="mono-num">
                  {availableFlights.length}
                </div>
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>Ready to book now</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>My Total Bookings</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '8px' }} className="mono-num">
                  {myBookings.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Completed trips & confirmed</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>My Electronic Tickets</span>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', marginTop: '8px' }} className="mono-num">
                  {myTickets.length}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Available for download / print</div>
              </div>
            </div>

            {/* Action Card */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  Ready for your next journey?
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Explore scheduled flights from Jalgaon Airport (JLG) to Mumbai, Delhi, Bengaluru, Goa & more.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('search')}
                style={{
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Search size={16} /> Search & Book Flights
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SEARCH FLIGHTS */}
        {activeTab === 'search' && (
          <div>
            {/* Search Filter Bar */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px' }}>
              <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 0.8fr auto', gap: '14px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>From (Source)</label>
                  <input
                    type="text"
                    placeholder="e.g. Jalgaon, Mumbai, Delhi..."
                    value={searchParams.from}
                    onChange={(e) => setSearchParams({ ...searchParams, from: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>To (Destination)</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai, Goa, Bengaluru..."
                    value={searchParams.to}
                    onChange={(e) => setSearchParams({ ...searchParams, to: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Travel Date</label>
                  <input
                    type="date"
                    value={searchParams.date}
                    onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0d1527',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Passengers</label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={searchParams.passengers}
                    onChange={(e) => setSearchParams({ ...searchParams, passengers: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '11px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)'
                  }}
                >
                  <Search size={15} /> Find Flights
                </button>
              </form>
            </div>

            {/* Results Grid */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                  Available Flights ({availableFlights.length})
                </h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Showing active flights with open seats
                </span>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Searching live database flights...</div>
              ) : availableFlights.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
                  <Plane size={36} color="#64748b" style={{ marginBottom: '12px' }} />
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>No Scheduled Flights Found</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>
                    {searchInitiated ? 'Try clearing your date or destination filter to view all active flights.' : 'Please wait while flights load...'}
                  </div>
                  {searchInitiated && (
                    <button
                      onClick={() => {
                        setSearchParams({ from: '', to: '', date: '', passengers: 1 });
                        api.searchFlights({}).then(res => res.success && setAvailableFlights(res.flights));
                      }}
                      style={{
                        marginTop: '16px',
                        padding: '8px 16px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '8px',
                        color: '#38bdf8',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Clear Filters & Show All Flights
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
                  {availableFlights.map(flight => (
                    <div
                      key={flight.id}
                      className="glass-panel"
                      style={{
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'transform 0.2s ease, border-color 0.2s ease'
                      }}
                    >
                      <div>
                        {/* Top Flight Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, fontSize: '16px', color: '#f8fafc' }}>{flight.flightNumber}</span>
                              <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                {flight.aircraft}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{flight.airline}</div>
                          </div>
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                            {flight.availableSeats} Seats Available
                          </span>
                        </div>

                        {/* Route Timeline */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '14px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '10px',
                          marginBottom: '16px'
                        }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>{flight.source}</div>
                            <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>{flight.departureTime}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{flight.departureDate}</div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>{flight.distance} KM</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '24px', height: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
                              <Plane size={14} color="#38bdf8" />
                              <span style={{ width: '24px', height: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>{flight.destination}</div>
                            <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>{flight.arrivalTime}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{flight.arrivalDate}</div>
                          </div>
                        </div>
                        {/* Carbon Footprint & Operational Status Badge */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'rgba(16, 185, 129, 0.06)',
                          borderRadius: '8px',
                          border: '1px solid rgba(16, 185, 129, 0.18)',
                          marginBottom: '14px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '13px' }}>🌱</span>
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                              Est. CO₂: <strong>{flight.estimatedCo2PerPaxKg || Math.round((flight.distance || 400) * 0.12)} kg CO₂</strong> / passenger
                            </span>
                          </div>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: flight.operationalStatus === 'CANCELLED' ? 'rgba(244, 63, 94, 0.15)' :
                                        flight.operationalStatus === 'DELAYED' ? 'rgba(245, 158, 11, 0.15)' :
                                        flight.operationalStatus === 'BOARDING' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                            color: flight.operationalStatus === 'CANCELLED' ? '#f43f5e' :
                                   flight.operationalStatus === 'DELAYED' ? '#f59e0b' :
                                   flight.operationalStatus === 'BOARDING' ? '#38bdf8' : '#94a3b8'
                          }}>
                            {flight.operationalStatus || 'SCHEDULED'}
                          </span>
                        </div>
                      </div>

                      {/* Fare & Book CTA */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '16px',
                        borderTop: '1px solid var(--border-subtle)'
                      }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Calculated Fare</div>
                          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }} className="mono-num">
                            Rs {Number(flight.calculatedPrice).toLocaleString()}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>Per Passenger (Taxes Incl.)</div>
                        </div>

                        <button
                          onClick={() => setSelectedFlightForBooking(flight)}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                            color: '#ffffff',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)'
                          }}
                        >
                          Book Now <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MY BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
              My Flight Bookings
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
              Your confirmed flight reservations
            </p>

            {myBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '12px' }}>
                <Calendar size={36} color="#64748b" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>No Bookings Made Yet</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Search and book a flight to view your confirmed itineraries.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>BOOKING ID</th>
                      <th style={{ padding: '12px' }}>FLIGHT</th>
                      <th style={{ padding: '12px' }}>ROUTE</th>
                      <th style={{ padding: '12px' }}>DEPARTURE</th>
                      <th style={{ padding: '12px' }}>PASSENGERS</th>
                      <th style={{ padding: '12px' }}>AMOUNT PAID</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBookings.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 800, color: '#38bdf8' }} className="mono-num">
                          {b.bookingId}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{b.flightNumber}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{b.aircraft}</div>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          {b.source} → {b.destination}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          {b.departureDate} at {b.departureTime}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          {b.passengers?.map(p => p.name).join(', ')} ({b.passengerCount} seat(s))
                        </td>
                        <td style={{ padding: '14px 12px', fontWeight: 800, color: '#10b981' }} className="mono-num">
                          Rs {Number(b.totalAmount).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          {b.ticketId && (
                            <button
                              onClick={() => {
                                api.getTicket(b.ticketId).then(res => res.success && setSelectedTicket(res.ticket));
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'rgba(56, 189, 248, 0.15)',
                                color: '#38bdf8',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={13} /> View Ticket
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY TICKETS */}
        {activeTab === 'tickets' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
              My Electronic Boarding Tickets
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
              Download or print your digital flight tickets with QR check-in
            </p>

            {myTickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '12px' }}>
                <Ticket size={36} color="#64748b" style={{ marginBottom: '12px' }} />
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>No Tickets Issued Yet</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Confirmed tickets will automatically appear here.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {myTickets.map(t => (
                  <div
                    key={t.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>PNR REFERENCE</div>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8' }} className="mono-num">{t.pnr}</div>
                        </div>
                        <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          {t.status}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        {t.flightNumber} ({t.airline})
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                        {t.source} → {t.destination}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Date: {t.departureDate} at {t.departureTime}
                      </div>

                      <div style={{ marginTop: '14px', padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Passengers:</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>
                          {t.passengers?.map(p => p.name).join(', ')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Total Amount</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }} className="mono-num">
                          Rs {Number(t.totalAmount).toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedTicket(t)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Eye size={13} /> View & Print
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROFILE */}
        {activeTab === 'profile' && (
          <div className="glass-panel" style={{ padding: '28px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <UserIcon size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>{user.name}</h3>
                <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  Passenger Account
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Email Address</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>{user.email}</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Account Type</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>Verified Passenger</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                background: 'rgba(244, 63, 94, 0.1)',
                color: '#f43f5e',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        )}

      </main>

      {/* Booking Checkout Modal */}
      {selectedFlightForBooking && (
        <BookingModal
          flight={selectedFlightForBooking}
          user={user}
          onClose={() => setSelectedFlightForBooking(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Ticket Viewer & Print Modal */}
      {selectedTicket && (
        <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}
