import React, { useState, useEffect } from 'react';
import { 
  Activity, Plane, AlertTriangle, CheckCircle, Clock, ShieldCheck, 
  RefreshCw, Navigation, AlertCircle
} from 'lucide-react';
import { api } from './api';

export default function FlightOperationsDashboard() {
  const [flights, setFlights] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  const statusOptions = ['Scheduled', 'Boarding', 'Departed', 'Arrived', 'Delayed', 'Cancelled'];

  const loadOperations = async () => {
    try {
      setLoading(true);
      const [flightsRes, insightsRes] = await Promise.all([
        api.getAdminFlights(),
        api.getAiOperationalInsights()
      ]);
      if (flightsRes.success) setFlights(flightsRes.flights);
      if (insightsRes.success) setInsights(insightsRes.insights);
    } catch (err) {
      console.error('Ops load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperations();
  }, []);

  const handleStatusChange = async (flightId, newStatus) => {
    try {
      const res = await api.updateFlightStatus(flightId, newStatus);
      if (res.success) {
        setFlights(prev => prev.map(f => f.id === flightId ? { ...f, status: newStatus } : f));
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const statusCounts = {
    Scheduled: flights.filter(f => f.status === 'Scheduled' || f.status === 'ACTIVE').length,
    Boarding: flights.filter(f => f.status === 'Boarding').length,
    Departed: flights.filter(f => f.status === 'Departed').length,
    Arrived: flights.filter(f => f.status === 'Arrived').length,
    Delayed: flights.filter(f => f.status === 'Delayed').length,
    Cancelled: flights.filter(f => f.status === 'Cancelled').length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Flight Operations Status Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="glass-panel" style={{ padding: '16px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{status}</span>
            <div style={{
              fontSize: '24px',
              fontWeight: 800,
              marginTop: '4px',
              color: status === 'Cancelled' ? '#f43f5e' : status === 'Delayed' ? '#f59e0b' : status === 'Departed' ? '#38bdf8' : '#10b981'
            }} className="mono-num">
              {count}
            </div>
          </div>
        ))}
      </div>

      {/* Operational & Sustainability AI Insights */}
      {insights.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #38bdf8' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#38bdf8" /> AI Operational & Sustainability Alerts ({insights.length})
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {insights.map((ins, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>{ins.title}</span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>{ins.category}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>{ins.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flight Deck Table with Status Controller */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
              Flight Operations & Dispatch Deck
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Real-time operational gate control, delays, and passenger seat loads
            </p>
          </div>
          <button
            onClick={loadOperations}
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
            <RefreshCw size={14} /> Refresh Ops
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading flight statuses...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '12px' }}>FLIGHT / CRAFT</th>
                  <th style={{ padding: '12px' }}>ROUTE</th>
                  <th style={{ padding: '12px' }}>SCHEDULE TIME</th>
                  <th style={{ padding: '12px' }}>SEATS BOOKED</th>
                  <th style={{ padding: '12px' }}>OCCUPANCY</th>
                  <th style={{ padding: '12px' }}>CURRENT STATUS</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>UPDATE STATUS</th>
                </tr>
              </thead>
              <tbody>
                {flights.map(f => {
                  const booked = f.totalSeats - f.availableSeats;
                  const occ = f.totalSeats > 0 ? ((booked / f.totalSeats) * 100).toFixed(0) : 0;
                  return (
                    <tr key={f.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>{f.flightNumber}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{f.aircraft}</div>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        {f.source} → {f.destination}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <div>{f.departureDate} at {f.departureTime}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Arr: {f.arrivalTime}</div>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <strong style={{ color: '#f8fafc' }}>{booked}</strong> / {f.totalSeats} seats
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '50px', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${occ}%`, height: '100%', background: occ > 75 ? '#10b981' : '#38bdf8' }} />
                          </div>
                          <span style={{ fontWeight: 700 }} className="mono-num">{occ}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: f.status === 'Cancelled' ? 'rgba(244, 63, 94, 0.15)' : f.status === 'Delayed' ? 'rgba(245, 158, 11, 0.15)' : f.status === 'Boarding' || f.status === 'Departed' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: f.status === 'Cancelled' ? '#f43f5e' : f.status === 'Delayed' ? '#f59e0b' : f.status === 'Boarding' || f.status === 'Departed' ? '#38bdf8' : '#10b981'
                        }}>
                          {f.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                        <select
                          value={f.status}
                          onChange={(e) => handleStatusChange(f.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            background: '#0d1527',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            color: '#f8fafc',
                            fontSize: '12px',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {statusOptions.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
