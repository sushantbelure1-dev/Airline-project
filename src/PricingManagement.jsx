import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Sliders, Save, RefreshCw, CheckCircle, AlertCircle, Info, Calculator
} from 'lucide-react';
import { api } from './api';

export default function PricingManagement() {
  const [config, setConfig] = useState({
    basePrice: 1000,
    pricePerKm: 5.0,
    fuelPricePerLiter: 100.0,
    fuelConsumptionPerKm: 0.05,
    serviceCharge: 200.0,
    taxPercentage: 5.0
  });
  const [previewDistance, setPreviewDistance] = useState(800);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load existing config
  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getPricingConfig();
      if (data.success && data.config) {
        setConfig(data.config);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Update live preview whenever inputs change
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const data = await api.getPricingPreview({
          distanceKm: previewDistance,
          ...config
        });
        if (data.success) {
          setPreview(data.preview);
        }
      } catch (err) {
        console.error('Preview error:', err);
      }
    };
    fetchPreview();
  }, [config, previewDistance]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const data = await api.updatePricingConfig(config);
      if (data.success) {
        setMessage('Pricing configuration saved to database successfully!');
        setConfig(data.config);
      } else {
        setError(data.message || 'Failed to save configuration');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
      {/* Configuration Form */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '10px' }}>
            <DollarSign size={20} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
              System Pricing Management
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Configure base tariffs, distance rates, fuel parameters & taxes
            </p>
          </div>
        </div>

        {message && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '12px', marginBottom: '16px' }}>
            <CheckCircle size={15} /> {message}
          </div>
        )}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', fontSize: '12px', marginBottom: '16px' }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Base Ticket Price (Rs)
            </label>
            <input
              type="number"
              min="0"
              required
              value={config.basePrice}
              onChange={(e) => setConfig({ ...config, basePrice: Number(e.target.value) })}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Distance Rate (Rs / KM)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={config.pricePerKm}
                onChange={(e) => setConfig({ ...config, pricePerKm: Number(e.target.value) })}
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
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Fuel Price (Rs / Liter)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={config.fuelPricePerLiter}
                onChange={(e) => setConfig({ ...config, fuelPricePerLiter: Number(e.target.value) })}
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Fuel Burn Rate (L / KM)
              </label>
              <input
                type="number"
                step="0.005"
                min="0"
                required
                value={config.fuelConsumptionPerKm}
                onChange={(e) => setConfig({ ...config, fuelConsumptionPerKm: Number(e.target.value) })}
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
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Service Charge (Rs)
              </label>
              <input
                type="number"
                min="0"
                required
                value={config.serviceCharge}
                onChange={(e) => setConfig({ ...config, serviceCharge: Number(e.target.value) })}
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
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Aviation Tax Percentage (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              required
              value={config.taxPercentage}
              onChange={(e) => setConfig({ ...config, taxPercentage: Number(e.target.value) })}
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
            disabled={saving}
            style={{
              marginTop: '10px',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(56, 189, 248, 0.35)'
            }}
          >
            <Save size={16} />
            <span>{saving ? 'Updating Database...' : 'Save & Deploy Pricing Settings'}</span>
          </button>
        </form>
      </div>

      {/* Live Calculation Preview */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px' }}>
              <Calculator size={20} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
                Live Dynamic Calculation Preview
              </h3>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                Instant simulation of flight fare calculation formula
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ color: '#94a3b8' }}>Simulation Test Distance:</span>
              <span style={{ fontWeight: 700, color: '#38bdf8' }} className="mono-num">{previewDistance} KM</span>
            </div>
            <input
              type="range"
              min="100"
              max="2500"
              step="50"
              value={previewDistance}
              onChange={(e) => setPreviewDistance(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
            />
          </div>

          {preview && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Base Fare:</span>
                <span style={{ fontWeight: 600 }}>Rs {preview.basePrice.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Distance Cost ({preview.distanceKm} KM × Rs {config.pricePerKm}):</span>
                <span style={{ fontWeight: 600 }}>Rs {preview.distanceCost.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Fuel Required ({preview.fuelRequiredLiters} L × Rs {config.fuelPricePerLiter}/L):</span>
                <span style={{ fontWeight: 600 }}>Rs {preview.fuelCost.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Service Charge:</span>
                <span style={{ fontWeight: 600 }}>Rs {preview.serviceCharge.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#94a3b8' }}>Aviation Tax ({preview.taxPercentage}%):</span>
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>Rs {preview.taxAmount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>Final Calculated Price:</span>
                <span style={{ fontSize: '26px', fontWeight: 800, color: '#10b981' }} className="mono-num">
                  Rs {preview.finalPrice.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '11px', color: '#cbd5e1' }}>
          <Info size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: '#38bdf8' }} />
          <strong>Formula Protected:</strong> All prices for newly registered flights and user ticket purchases are automatically recalculated on the backend to enforce zero tampering.
        </div>
      </div>
    </div>
  );
}
