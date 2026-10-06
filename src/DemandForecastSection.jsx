import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, AlertCircle, Info, Sparkles, Calendar, CheckCircle
} from 'lucide-react';
import { api } from './api';

export default function DemandForecastSection() {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true);
        const res = await api.getAiDemandForecast();
        if (res.success) {
          setForecastData(res);
        }
      } catch (err) {
        console.error('Forecast error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadForecast();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Evaluating historical passenger booking velocity...</div>;
  }

  const { hasSufficientData, message, forecasts } = forecastData || {};

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '10px' }}>
          <TrendingUp size={20} color="#38bdf8" />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
            AI-Based Demand Forecasting & Seat Projection
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Predictive machine learning models based strictly on actual booking trends
          </p>
        </div>
      </div>

      {/* Fallback Notice if data is insufficient (Strict rule compliance) */}
      {!hasSufficientData ? (
        <div style={{
          padding: '28px',
          background: 'rgba(245, 158, 11, 0.08)',
          borderRadius: '12px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          textAlign: 'center'
        }}>
          <AlertCircle size={36} color="#f59e0b" style={{ marginBottom: '12px' }} />
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
            Insufficient Historical Data for Reliable Prediction
          </h4>
          <p style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '640px', margin: '0 auto', lineHeight: '1.6' }}>
            {message}
          </p>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px' }}>
            Once at least 3 confirmed passenger bookings are recorded in the database, demand curve projections will automatically display here.
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
            {forecasts?.map((f, idx) => (
              <div
                key={idx}
                style={{
                  padding: '18px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#f8fafc' }}>{f.flightNumber}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{f.route}</div>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: f.demandLevel === 'High Demand' ? 'rgba(56, 189, 248, 0.15)' : f.demandLevel === 'Low Demand' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: f.demandLevel === 'High Demand' ? '#38bdf8' : f.demandLevel === 'Low Demand' ? '#f59e0b' : '#10b981'
                    }}>
                      {f.demandLevel}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px', fontSize: '12px' }}>
                    <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>Expected Occupancy</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }} className="mono-num">
                        {f.expectedOccupancy}%
                      </div>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>Projected Revenue</span>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', marginTop: '2px' }} className="mono-num">
                        Rs {Number(f.expectedRevenue).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  Current Bookings: <strong style={{ color: '#f8fafc' }}>{f.currentBookings} seats</strong> • Expected: <strong style={{ color: '#38bdf8' }}>{f.expectedBookings} seats</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
