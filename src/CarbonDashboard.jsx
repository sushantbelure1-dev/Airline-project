import React, { useState, useEffect } from 'react';
import { 
  Leaf, Wind, TreePine, Droplet, ArrowRight, BarChart2, ShieldCheck, 
  HelpCircle, AlertTriangle, Layers
} from 'lucide-react';
import { api } from './api';

export default function CarbonDashboard() {
  const [sustainability, setSustainability] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCarbon() {
      try {
        setLoading(true);
        const res = await api.getSustainabilityAnalytics();
        if (res.success) {
          setSustainability(res.sustainability);
        }
      } catch (err) {
        console.error('Carbon analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCarbon();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Loading Carbon & Sustainability telemetry...</div>;
  }

  const { summary, emissionsByRoute, aircraftEfficiency } = sustainability || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total Estimated CO₂</span>
            <Leaf size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '8px' }} className="mono-num">
            {summary?.totalCo2Tonnes} <span style={{ fontSize: '16px', fontWeight: 600 }}>Tonnes</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {Number(summary?.totalCo2Kg || 0).toLocaleString()} kg CO₂ across network
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Avg CO₂ Per Passenger</span>
            <Wind size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', marginTop: '8px' }} className="mono-num">
            {summary?.avgCo2PerPaxKg} <span style={{ fontSize: '16px', fontWeight: 600 }}>kg</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Per confirmed passenger seat</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Jet Fuel Consumed</span>
            <Droplet size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', marginTop: '8px' }} className="mono-num">
            {Number(summary?.totalFuelLiters || 0).toLocaleString()} <span style={{ fontSize: '16px', fontWeight: 600 }}>L</span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Factor: {summary?.emissionFactor} {summary?.emissionFactorUnit}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Tree Offset Equiv.</span>
            <TreePine size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '8px' }} className="mono-num">
            {Number(summary?.treesOffsetEquivalent || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Mature trees annual absorption</div>
        </div>
      </div>

      {/* Grid: Emissions by Route & Aircraft Efficiency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Route Emissions */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
            Emissions by Flight Route
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
            Estimated fuel burn and cumulative CO₂ by sector
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {emissionsByRoute?.map((r, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>{r.route}</span>
                  <span style={{ fontWeight: 800, color: '#10b981', fontSize: '13px' }} className="mono-num">
                    {r.co2Tonnes} Tonnes CO₂
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                  <span>{r.flightCount} Scheduled Flights • Total {r.totalDistance} KM</span>
                  <span>{r.fuelLiters.toLocaleString()} L Fuel Consumed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aircraft Model Efficiency */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
            Aircraft Fleet Efficiency
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
            Objective metrics by aircraft model (Zero artificial labels)
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {aircraftEfficiency?.map((a, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px' }}>{a.aircraft}</span>
                  <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }} className="mono-num">
                    {a.avgFuelBurnPerKm} L / KM
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  <div>Flights: <strong style={{ color: '#f8fafc' }}>{a.flightsOperated}</strong></div>
                  <div>Distance: <strong style={{ color: '#f8fafc' }}>{a.totalKm} KM</strong></div>
                  <div>Fuel: <strong style={{ color: '#f8fafc' }}>{a.totalFuelLiters.toLocaleString()} L</strong></div>
                  <div>CO₂ / Seat: <strong style={{ color: '#10b981' }}>{a.co2PerCapacitySeat} kg</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimers & Sustainability Guidance */}
      <div style={{ padding: '16px 20px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
        <strong>Carbon Transparency Notice:</strong> All carbon metrics shown across flight searches, booking flows, and reports are <strong>estimated emissions</strong> calculated based on sector distance, manufacturer fuel burn rates, and the configurable CO₂ emission factor ({summary?.emissionFactor} {summary?.emissionFactorUnit}). Actual emissions may vary based on air traffic holding patterns, aircraft weight, and wind direction.
      </div>
    </div>
  );
}
