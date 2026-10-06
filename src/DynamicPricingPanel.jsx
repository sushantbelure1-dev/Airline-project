import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Sparkles, Check, X, AlertCircle, ArrowUpRight, ArrowDownRight, 
  HelpCircle, RefreshCw, BarChart2
} from 'lucide-react';
import { api } from './api';

export default function DynamicPricingPanel({ onPriceUpdated }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.getAiPricingRecommendations();
      if (res.success) {
        setRecommendations(res.recommendations);
      }
    } catch (err) {
      console.error('Pricing rec error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleAccept = async (rec) => {
    try {
      const res = await api.applyAiPrice(rec.flightId, rec.recommendedPrice);
      if (res.success) {
        setActionMessage(`Accepted recommendation: ${rec.flightNumber} updated to Rs ${rec.recommendedPrice.toLocaleString()}`);
        loadRecommendations();
        if (onPriceUpdated) onPriceUpdated();
        setTimeout(() => setActionMessage(''), 4000);
      }
    } catch (err) {
      alert(`Error applying price: ${err.message}`);
    }
  };

  const handleIgnore = (flightId) => {
    setRecommendations(prev => prev.filter(r => r.flightId !== flightId));
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
              AI Dynamic Pricing Recommendations
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Algorithmic yield recommendations based on live occupancy & booking velocity (Admin approval required)
          </p>
        </div>

        <button
          onClick={loadRecommendations}
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
          <RefreshCw size={14} /> Recalculate AI Yields
        </button>
      </div>

      {actionMessage && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '12px', marginBottom: '16px' }}>
          {actionMessage}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Evaluating seat occupancy & demand vectors...</div>
      ) : recommendations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '12px' }}>
          <TrendingUp size={36} color="#64748b" style={{ marginBottom: '10px' }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>All Flight Fares are Currently Optimal</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>No pricing adjustments required based on current seat velocity.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {recommendations.map(rec => {
            const isSurge = rec.priceDifference > 0;
            const isDiscount = rec.priceDifference < 0;
            return (
              <div
                key={rec.flightId}
                style={{
                  padding: '18px 20px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#f8fafc' }}>{rec.flightNumber}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{rec.route}</span>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      background: rec.demandLevel === 'High Demand' ? 'rgba(56, 189, 248, 0.15)' : rec.demandLevel === 'Low Demand' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                      color: rec.demandLevel === 'High Demand' ? '#38bdf8' : rec.demandLevel === 'Low Demand' ? '#f59e0b' : '#94a3b8'
                    }}>
                      {rec.demandLevel} ({rec.occupancyPercent}% Occupancy)
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '6px' }}>
                    Reason: <em>"{rec.reason}"</em>
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {rec.bookedSeats}/{rec.totalSeats} seats booked • Departs: {rec.departureDate}
                  </div>
                </div>

                {/* Price Shift & Decision Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Current Fare: Rs {rec.currentPrice.toLocaleString()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: isSurge ? '#38bdf8' : isDiscount ? '#f59e0b' : '#10b981' }} className="mono-num">
                        Rs {rec.recommendedPrice.toLocaleString()}
                      </span>
                      {isSurge ? (
                        <ArrowUpRight size={16} color="#38bdf8" />
                      ) : isDiscount ? (
                        <ArrowDownRight size={16} color="#f59e0b" />
                      ) : null}
                    </div>
                    <div style={{ fontSize: '10px', color: isSurge ? '#38bdf8' : isDiscount ? '#f59e0b' : '#64748b' }}>
                      {rec.adjustmentPercent > 0 ? `+${rec.adjustmentPercent}%` : `${rec.adjustmentPercent}%`} Adjustment
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAccept(rec)}
                      disabled={rec.currentPrice === rec.recommendedPrice}
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
                        gap: '4px'
                      }}
                    >
                      <Check size={14} /> Accept Recommendation
                    </button>
                    <button
                      onClick={() => handleIgnore(rec.flightId)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: '#94a3b8',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={14} /> Ignore
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
