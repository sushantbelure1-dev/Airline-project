import React, { useState, useEffect } from 'react';
import { 
  BarChart2, CheckSquare, Square, ArrowUpDown, DollarSign, 
  Leaf, Users, Plane, Droplet
} from 'lucide-react';
import { api } from './api';

export default function FlightComparisonSection() {
  const [flights, setFlights] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchList() {
      try {
        setLoading(true);
        const res = await api.getCombinedFlightAnalytics();
        if (res.success) {
          setFlights(res.flights);
          if (res.flights.length >= 2) {
            setSelectedIds([res.flights[0].id, res.flights[1].id]);
          } else if (res.flights.length === 1) {
            setSelectedIds([res.flights[0].id]);
          }
        }
      } catch (err) {
        console.error('Combined analytics error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        if (prev.length >= 4) {
          alert('You can compare up to 4 flights simultaneously.');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const comparedFlights = flights.filter(f => selectedIds.includes(f.id));

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Loading flight comparison matrix...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Flight Selection Pills */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
          Select Flights to Compare (Select 2 to 4)
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {flights.map(f => {
            const isSelected = selectedIds.includes(f.id);
            return (
              <button
                key={f.id}
                onClick={() => toggleSelect(f.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                  color: isSelected ? '#38bdf8' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                <span>{f.flightNumber} ({f.source} → {f.destination})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Grid Matrix */}
      {comparedFlights.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          Select at least 2 flights from above to generate comparative analytics.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparedFlights.length}, 1fr)`, gap: '18px' }}>
          {comparedFlights.map(f => (
            <div
              key={f.id}
              className="glass-panel"
              style={{
                padding: '24px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>{f.flightNumber}</div>
                <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>{f.source} → {f.destination}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{f.airline} • {f.aircraft}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Generated Revenue</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', marginTop: '2px' }} className="mono-num">
                  Rs {Number(f.revenue).toLocaleString()}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Occupancy %</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }} className="mono-num">
                  {f.occupancy}%
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{f.totalSeats - f.availableSeats} of {f.totalSeats} seats</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Published Fare</span>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }} className="mono-num">
                  Rs {Number(f.calculatedPrice).toLocaleString()}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Route Distance</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }} className="mono-num">
                  {f.distance} KM
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Fuel Consumed</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }} className="mono-num">
                  {Number(f.fuelConsumedLiters || 0).toLocaleString()} L
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Estimated Flight CO₂</span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', marginTop: '2px' }} className="mono-num">
                  {Number(f.totalEstimatedCo2Kg || 0).toLocaleString()} kg
                </div>
                <div style={{ fontSize: '10px', color: '#38bdf8', marginTop: '2px' }}>
                  ~{f.co2PerPax} kg CO₂ / pax
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
