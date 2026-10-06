import React, { useState, useEffect } from 'react';
import { 
  Activity, Plane, DollarSign, Calendar, Users, Ticket, 
  PlusCircle, Edit, Trash2, Search, Filter, ShieldCheck, Eye, RefreshCw,
  Sparkles, TrendingUp, Leaf, Bot, BarChart2, Layers, FileText, CloudSun
} from 'lucide-react';
import { api } from './api';
import AddFlightForm from './AddFlightForm';
import PricingManagement from './PricingManagement';
import TicketModal from './TicketModal';
import DynamicPricingPanel from './DynamicPricingPanel';
import DemandForecastSection from './DemandForecastSection';
import RevenueAnalyticsDashboard from './RevenueAnalyticsDashboard';
import CarbonDashboard from './CarbonDashboard';
import FlightOperationsDashboard from './FlightOperationsDashboard';
import AIAssistantWidget from './AIAssistantWidget';
import FlightComparisonSection from './FlightComparisonSection';
import ReportsSection from './ReportsSection';
import CrewManagement from './CrewManagement';
import WeatherForecastDashboard from './WeatherForecastDashboard';


export default function AdminDashboard({ onLogout }) {

  const [activeTab, setActiveTab] = useState('overview'); 
  // 'overview', 'flights', 'add-flight', 'pricing', 'dynamic-pricing', 'demand-forecast', 'revenue-analytics', 'operations', 'carbon', 'assistant', 'comparison', 'reports', 'bookings', 'users', 'tickets'

  const [stats, setStats] = useState({
    totalFlights: 0,
    activeFlights: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalTickets: 0,
    revenue: 0,
    availableSeats: 0,
    totalEstimatedCo2Kg: 0,
    avgOccupancy: 0
  });

  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [editingFlight, setEditingFlight] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingFilter, setBookingFilter] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.getAdminStats();
      if (res.success) setStats(res.stats);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchFlights = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminFlights();
      if (res.success) setFlights(res.flights);
    } catch (err) {
      console.error('Flights error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminBookings();
      if (res.success) setBookings(res.bookings);
    } catch (err) {
      console.error('Bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminUsers();
      if (res.success) setUsers(res.users);
    } catch (err) {
      console.error('Users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminTickets();
      if (res.success) setTickets(res.tickets);
    } catch (err) {
      console.error('Tickets error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    if (activeTab === 'flights') fetchFlights();
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'tickets') fetchTickets();
  }, [activeTab]);

  const handleDeleteFlight = async (id) => {
    if (!window.confirm('Are you sure you want to delete or cancel this flight?')) return;
    try {
      const res = await api.deleteFlight(id);
      if (res.success) {
        alert(res.message);
        fetchFlights();
        fetchStats();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditFlight = (flight) => {
    setEditingFlight(flight);
    setActiveTab('add-flight');
  };

  const filteredBookings = bookings.filter(b => {
    if (!bookingFilter) return true;
    const q = bookingFilter.toLowerCase();
    return (
      b.bookingId.toLowerCase().includes(q) ||
      b.flightNumber.toLowerCase().includes(q) ||
      b.userName.toLowerCase().includes(q) ||
      b.userEmail.toLowerCase().includes(q) ||
      b.status.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 75px)' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: '275px',
        background: 'rgba(10, 17, 34, 0.95)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Main Command
          </div>

          {[
            { id: 'overview', label: 'Executive Cockpit', icon: Activity },
            { id: 'flights', label: 'Manage Flights', icon: Plane },
            { id: 'add-flight', label: 'Add Flight', icon: PlusCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { if (tab.id !== 'add-flight') setEditingFlight(null); setActiveTab(tab.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(2, 132, 199, 0.1) 100%)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div style={{ padding: '12px 12px 6px', fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AI & Revenue Engine
          </div>

          {[
            { id: 'dynamic-pricing', label: 'AI Dynamic Pricing', icon: Sparkles },
            { id: 'demand-forecast', label: 'Demand Forecasting', icon: TrendingUp },
            { id: 'revenue-analytics', label: 'Revenue Analytics', icon: DollarSign },
            { id: 'pricing', label: 'Configure Tariffs', icon: DollarSign }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setEditingFlight(null); setActiveTab(tab.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(2, 132, 199, 0.1) 100%)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div style={{ padding: '12px 12px 6px', fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ops & Sustainability
          </div>

          {[
            { id: 'operations', label: 'Operations & Dispatch', icon: Activity },
            { id: 'weather', label: 'Aviation Weather Radar', icon: CloudSun },
            { id: 'crew', label: 'Crew Staff & Pilots', icon: Users },
            { id: 'carbon', label: 'Carbon & ESG Tracker', icon: Leaf },
            { id: 'comparison', label: 'Flight Comparison Matrix', icon: Layers },
            { id: 'reports', label: 'Compliance Reports', icon: FileText },
            { id: 'assistant', label: 'Admin AI Assistant', icon: Bot }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setEditingFlight(null); setActiveTab(tab.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)' : 'transparent',
                  color: isActive ? '#10b981' : '#94a3b8',
                  borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div style={{ padding: '12px 12px 6px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ledger & Records
          </div>

          {[
            { id: 'bookings', label: 'Passenger Bookings', icon: Calendar },
            { id: 'users', label: 'Registered Users', icon: Users },
            { id: 'tickets', label: 'Issued Tickets', icon: Ticket }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setEditingFlight(null); setActiveTab(tab.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(2, 132, 199, 0.1) 100%)' : 'transparent',
                  color: isActive ? '#38bdf8' : '#94a3b8',
                  borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onLogout}
          style={{
            marginTop: '20px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            background: 'rgba(244, 63, 94, 0.1)',
            color: '#f43f5e',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Logout Admin
        </button>
      </aside>

      {/* Main Content View */}
      <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
        {/* 1. EXECUTIVE COCKPIT OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                  AeroIntellect AI Executive Cockpit
                </h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                  Real-time Airline Revenue, Operations Management & Scope 1 Carbon Intelligence
                </p>
              </div>
              <button
                onClick={fetchStats}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} /> Refresh Data
              </button>
            </div>

            {/* Top KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total Revenue</span>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '6px' }} className="mono-num">
                  Rs {Number(stats.revenue).toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>From confirmed passenger seats</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Fleet Seat Occupancy</span>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }} className="mono-num">
                  {stats.avgOccupancy}%
                </div>
                <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>{stats.availableSeats} available seats</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Estimated Carbon CO₂</span>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '6px' }} className="mono-num">
                  {stats.totalEstimatedCo2Tonnes} <span style={{ fontSize: '16px' }}>T</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  {Number(stats.totalEstimatedCo2Kg).toLocaleString()} kg CO₂ footprint
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Active Schedules</span>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', marginTop: '6px' }} className="mono-num">
                  {stats.activeFlights}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Of {stats.totalFlights} registered routes</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total Bookings</span>
                <div style={{ fontSize: '26px', fontWeight: 800, color: '#f59e0b', marginTop: '6px' }} className="mono-num">
                  {stats.totalBookings}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{stats.totalTickets} tickets issued</div>
              </div>
            </div>

            {/* Quick Access Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 700, marginBottom: '8px' }}>
                  <Sparkles size={16} /> AI Dynamic Pricing Engine
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '14px' }}>
                  Evaluate demand elasticity and approve recommended surge or discount tariffs.
                </p>
                <button
                  onClick={() => setActiveTab('dynamic-pricing')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Review AI Yield Recommendations →
                </button>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, marginBottom: '8px' }}>
                  <Leaf size={16} /> Carbon & ESG Intelligence
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '14px' }}>
                  Track Scope 1 fuel emissions, aircraft model efficiencies, and per-passenger carbon offsets.
                </p>
                <button
                  onClick={() => setActiveTab('carbon')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Open Carbon Dashboard →
                </button>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, marginBottom: '8px' }}>
                  <Bot size={16} /> Grounded AI Assistant
                </div>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '14px' }}>
                  Query real-time revenue, top routes, aircraft fuel burn, and seat trends in natural language.
                </p>
                <button
                  onClick={() => setActiveTab('assistant')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#f59e0b',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Ask AI Assistant →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. MANAGE FLIGHTS */}
        {activeTab === 'flights' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                  Managed Aircraft & Flight Schedules
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {flights.length} flights currently stored in SQLite database
                </p>
              </div>
              <button
                onClick={() => { setEditingFlight(null); setActiveTab('add-flight'); }}
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
                <PlusCircle size={15} /> Add Flight
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading flight schedules...</div>
            ) : flights.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>No flights found. Click "Add Flight" above.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>FLIGHT / AIRCRAFT</th>
                      <th style={{ padding: '12px' }}>ROUTE</th>
                      <th style={{ padding: '12px' }}>SCHEDULE</th>
                      <th style={{ padding: '12px' }}>DISTANCE</th>
                      <th style={{ padding: '12px' }}>SEATS</th>
                      <th style={{ padding: '12px' }}>FARE</th>
                      <th style={{ padding: '12px' }}>CO₂ / PAX</th>
                      <th style={{ padding: '12px' }}>STATUS</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flights.map(f => (
                      <tr key={f.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{f.flightNumber}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{f.aircraft}</div>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{f.source} → {f.destination}</div>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div>{f.departureDate} ({f.departureTime})</div>
                        </td>
                        <td style={{ padding: '14px 12px' }} className="mono-num">
                          {f.distance} KM
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{ fontWeight: 700, color: f.availableSeats > 10 ? '#10b981' : '#f59e0b' }} className="mono-num">
                            {f.availableSeats}
                          </span>
                          <span style={{ color: '#64748b' }}> / {f.totalSeats}</span>
                        </td>
                        <td style={{ padding: '14px 12px', fontWeight: 700, color: '#38bdf8' }} className="mono-num">
                          Rs {Number(f.calculatedPrice).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 12px', color: '#10b981', fontWeight: 600 }} className="mono-num">
                          {f.carbonMetrics?.co2PerPaxKg || Math.round(f.totalEstimatedCo2Kg / f.totalSeats)} kg
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: f.status === 'Cancelled' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: f.status === 'Cancelled' ? '#f43f5e' : '#10b981'
                          }}>
                            {f.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleEditFlight(f)}
                              style={{ padding: '6px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', color: '#38bdf8', cursor: 'pointer' }}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteFlight(f.id)}
                              style={{ padding: '6px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '6px', color: '#f43f5e', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. ADD / EDIT FLIGHT */}
        {activeTab === 'add-flight' && (
          <AddFlightForm
            editingFlight={editingFlight}
            onCancelEdit={() => { setEditingFlight(null); setActiveTab('flights'); }}
            onFlightAdded={() => {
              setEditingFlight(null);
              setActiveTab('flights');
              fetchFlights();
              fetchStats();
            }}
          />
        )}

        {/* 4. AI DYNAMIC PRICING */}
        {activeTab === 'dynamic-pricing' && (
          <DynamicPricingPanel onPriceUpdated={fetchStats} />
        )}

        {/* 5. DEMAND FORECAST */}
        {activeTab === 'demand-forecast' && (
          <DemandForecastSection />
        )}

        {/* 6. REVENUE ANALYTICS */}
        {activeTab === 'revenue-analytics' && (
          <RevenueAnalyticsDashboard />
        )}

        {/* 7. OPERATIONS DASHBOARD */}
        {activeTab === 'operations' && (
          <FlightOperationsDashboard />
        )}

        {/* AVIATION WEATHER INTELLIGENCE & RADAR */}
        {activeTab === 'weather' && (
          <WeatherForecastDashboard />
        )}

        {/* CREW STAFF & PILOT MANAGEMENT */}
        {activeTab === 'crew' && (
          <CrewManagement />
        )}

        {/* 8. CARBON DASHBOARD */}
        {activeTab === 'carbon' && (
          <CarbonDashboard />
        )}

        {/* 9. FLIGHT COMPARISON */}
        {activeTab === 'comparison' && (
          <FlightComparisonSection />
        )}

        {/* 10. REPORTS */}
        {activeTab === 'reports' && (
          <ReportsSection />
        )}

        {/* 11. ADMIN AI ASSISTANT */}
        {activeTab === 'assistant' && (
          <AIAssistantWidget />
        )}

        {/* 12. PRICING & TARIFF CONFIGURATION */}
        {activeTab === 'pricing' && (
          <PricingManagement />
        )}

        {/* 13. BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                  Passenger Bookings Ledger
                </h3>
                <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                  All confirmed flight reservations across the airline
                </p>
              </div>

              <div style={{ position: 'relative', width: '280px' }}>
                <input
                  type="text"
                  placeholder="Filter by PNR, Flight, Name..."
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>No passenger reservations found.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>BOOKING ID</th>
                      <th style={{ padding: '12px' }}>PASSENGER</th>
                      <th style={{ padding: '12px' }}>FLIGHT</th>
                      <th style={{ padding: '12px' }}>SEATS</th>
                      <th style={{ padding: '12px' }}>AMOUNT</th>
                      <th style={{ padding: '12px' }}>DATE</th>
                      <th style={{ padding: '12px' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 800, color: '#38bdf8' }} className="mono-num">
                          {b.bookingId}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{b.userName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{b.userEmail}</div>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{b.flightNumber}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{b.source} → {b.destination}</div>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          {b.passengerCount} seat(s)
                        </td>
                        <td style={{ padding: '14px 12px', fontWeight: 800, color: '#10b981' }} className="mono-num">
                          Rs {Number(b.totalAmount).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 12px', fontSize: '12px', color: '#94a3b8' }}>
                          {b.bookingDate?.slice(0, 16).replace('T', ' ')}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981'
                          }}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 14. USERS */}
        {activeTab === 'users' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
              Registered User Accounts
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
              Database records of administrators and passengers
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>ID</th>
                    <th style={{ padding: '12px' }}>NAME</th>
                    <th style={{ padding: '12px' }}>EMAIL</th>
                    <th style={{ padding: '12px' }}>ROLE</th>
                    <th style={{ padding: '12px' }}>CREATED AT</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '14px 12px', color: '#64748b' }}>#{u.id}</td>
                      <td style={{ padding: '14px 12px', fontWeight: 700, color: '#f8fafc' }}>{u.name}</td>
                      <td style={{ padding: '14px 12px', color: '#94a3b8' }}>{u.email}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: u.role === 'ADMIN' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: u.role === 'ADMIN' ? '#38bdf8' : '#10b981'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', color: '#94a3b8', fontSize: '12px' }}>
                        {u.createdAt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 15. TICKETS */}
        {activeTab === 'tickets' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
              Issued Electronic Boarding Tickets
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>
              Digital boarding passes and PNR codes stored in database
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#64748b', textAlign: 'left' }}>
                    <th style={{ padding: '12px' }}>PNR</th>
                    <th style={{ padding: '12px' }}>BOOKING ID</th>
                    <th style={{ padding: '12px' }}>FLIGHT</th>
                    <th style={{ padding: '12px' }}>PASSENGERS</th>
                    <th style={{ padding: '12px' }}>TOTAL FARE</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '14px 12px', fontWeight: 800, color: '#f8fafc' }} className="mono-num">{t.pnr}</td>
                      <td style={{ padding: '14px 12px', color: '#38bdf8' }} className="mono-num">{t.bookingId}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{t.flightNumber}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.source} → {t.destination}</div>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        {t.passengerList?.map(p => p.name).join(', ')} ({t.passengerCount} seats)
                      </td>
                      <td style={{ padding: '14px 12px', fontWeight: 800, color: '#10b981' }} className="mono-num">
                        Rs {Number(t.totalAmount).toLocaleString()}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedTicket({ ...t, passengers: t.passengerList })}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} /> View Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Ticket Viewer Modal */}
      {selectedTicket && (
        <TicketModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}
