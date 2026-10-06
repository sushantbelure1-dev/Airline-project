import React, { useState, useEffect } from 'react';
import { 
  CloudSun, Wind, Eye, Gauge, ShieldAlert, CheckCircle, AlertTriangle, 
  RefreshCw, CloudRain, Sun, CloudFog, Zap, Compass, Sliders, Plane
} from 'lucide-react';
import { api } from './api';

export default function WeatherForecastDashboard() {
  const [weatherList, setWeatherList] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Edit State for Admin Weather Simulator
  const [editForm, setEditForm] = useState({
    tempCelsius: 28,
    condition: 'Clear Sky',
    windSpeedKnots: 10,
    windDirection: 'WSW',
    visibilityMeters: 9000,
    pressureHpa: 1013,
    safetyStatus: 'SAFE_TO_FLY'
  });

  const loadWeatherData = async () => {
    setLoading(true);
    try {
      const res = await api.getWeather();
      if (res.success && res.weather.length > 0) {
        setWeatherList(res.weather);
        const jlg = res.weather.find(w => w.airportCode === 'JLG') || res.weather[0];
        setSelectedAirport(jlg);
        populateForm(jlg);
      }
    } catch (err) {
      console.error('Error loading weather:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeatherData();
  }, []);

  const populateForm = (airport) => {
    setEditForm({
      tempCelsius: airport.tempCelsius,
      condition: airport.condition,
      windSpeedKnots: airport.windSpeedKnots,
      windDirection: airport.windDirection,
      visibilityMeters: airport.visibilityMeters,
      pressureHpa: airport.pressureHpa,
      safetyStatus: airport.safetyStatus
    });
  };

  const handleSelectAirport = (airport) => {
    setSelectedAirport(airport);
    populateForm(airport);
  };

  const handleSimulateUpdate = async (e) => {
    e.preventDefault();
    if (!selectedAirport) return;

    setUpdating(true);
    try {
      const res = await api.updateAirportWeather(selectedAirport.airportCode, editForm);
      if (res.success) {
        alert(`✅ Weather & Safety Status updated for ${selectedAirport.airportCode}!`);
        await loadWeatherData();
      }
    } catch (err) {
      console.error('Error updating weather:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Helper for weather icons
  const getWeatherIcon = (condition, size = 24) => {
    const cond = (condition || '').toLowerCase();
    if (cond.includes('thunder')) return <Zap size={size} color="#f59e0b" />;
    if (cond.includes('rain')) return <CloudRain size={size} color="#38bdf8" />;
    if (cond.includes('fog')) return <CloudFog size={size} color="#94a3b8" />;
    if (cond.includes('cloud')) return <CloudSun size={size} color="#38bdf8" />;
    return <Sun size={size} color="#f59e0b" />;
  };

  // Helper for safety status badges
  const getSafetyBadge = (status) => {
    switch (status) {
      case 'SAFE_TO_FLY':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '11px', fontWeight: 700 }}>
            <CheckCircle size={14} /> SAFE TO FLY
          </span>
        );
      case 'CAUTION_HIGH_WINDS':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '11px', fontWeight: 700 }}>
            <AlertTriangle size={14} /> CAUTION: HIGH WINDS
          </span>
        );
      case 'DELAYED_DENSE_FOG':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(148, 163, 184, 0.2)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.4)', fontSize: '11px', fontWeight: 700 }}>
            <CloudFog size={14} /> FLIGHT DELAY: DENSE FOG
          </span>
        );
      case 'REROUTE_THUNDERSTORM':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)', fontSize: '11px', fontWeight: 700 }}>
            <ShieldAlert size={14} /> REROUTE: SEVERE THUNDERSTORM
          </span>
        );
      default:
        return null;
    }
  };

  // Generate Aviation METAR String
  const generateMetar = (w) => {
    if (!w) return '';
    const tempStr = `${Math.round(w.tempCelsius)}/${Math.round(w.tempCelsius - 10)}`;
    const windStr = `${w.windDirection}${String(Math.round(w.windSpeedKnots)).padStart(2, '0')}KT`;
    const visStr = w.visibilityMeters >= 9999 ? '9999' : String(w.visibilityMeters).padStart(4, '0');
    const pressStr = `Q${Math.round(w.pressureHpa)}`;
    return `METAR VA${w.airportCode} 061600Z ${windStr} ${visStr} ${w.condition.toUpperCase()} ${tempStr} ${pressStr} NOSIG`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.08 }}>
          <CloudSun size={200} color="#38bdf8" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 2 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                Aviation Weather Intelligence & Flight Safety Radar
              </h2>
              <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                Real-Time METAR Telemetry
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Monitoring atmospheric safety parameters, wind velocity, and visibility for Jalgaon Hub (JLG) and connected airports.
            </p>
          </div>

          <button
            onClick={loadWeatherData}
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
            <RefreshCw size={14} /> Refresh Weather Telemetry
          </button>
        </div>
      </div>

      {/* Airport Weather Grid Cards */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plane size={18} color="#38bdf8" /> Connected Airport Weather Hubs
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {weatherList.map(airport => {
            const isSelected = selectedAirport?.airportCode === airport.airportCode;
            return (
              <div
                key={airport.airportCode}
                onClick={() => handleSelectAirport(airport)}
                className="glass-panel"
                style={{
                  padding: '18px',
                  cursor: 'pointer',
                  borderLeft: isSelected ? '4px solid #38bdf8' : '4px solid transparent',
                  background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc' }}>
                      {airport.airportCode}
                    </span>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {airport.city}
                    </div>
                  </div>
                  <div>
                    {getWeatherIcon(airport.condition, 28)}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#38bdf8' }}>
                    {airport.tempCelsius}°C
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>
                    {airport.condition}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#94a3b8', background: 'rgba(0, 0, 0, 0.2)', padding: '8px 10px', borderRadius: '6px', marginBottom: '12px' }}>
                  <div>💨 Wind: <strong style={{ color: '#f8fafc' }}>{airport.windSpeedKnots} kts {airport.windDirection}</strong></div>
                  <div>👁️ Vis: <strong style={{ color: '#f8fafc' }}>{airport.visibilityMeters}m</strong></div>
                </div>

                <div>
                  {getSafetyBadge(airport.safetyStatus)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Airport Detail & Admin Weather Simulator */}
      {selectedAirport && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
          {/* Detailed Aviation Telemetry & METAR */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#38bdf8' }}>
                  {selectedAirport.airportCode}
                </span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                    {selectedAirport.city} Safety Telemetry
                  </h3>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Station Code: VA{selectedAirport.airportCode}
                  </div>
                </div>
              </div>
              {getSafetyBadge(selectedAirport.safetyStatus)}
            </div>

            {/* Metrics Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <Wind size={14} color="#38bdf8" /> Wind Speed & Vector
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                  {selectedAirport.windSpeedKnots} Knots ({Math.round(selectedAirport.windSpeedKnots * 1.852)} km/h)
                </div>
                <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>
                  Direction: {selectedAirport.windDirection}
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <Eye size={14} color="#10b981" /> Runway Visibility Range
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                  {selectedAirport.visibilityMeters} Meters
                </div>
                <div style={{ fontSize: '11px', color: selectedAirport.visibilityMeters >= 5000 ? '#10b981' : '#f59e0b', marginTop: '2px' }}>
                  {selectedAirport.visibilityMeters >= 5000 ? 'Clear Visual Flight Rules (VFR)' : 'Instrument Flight Rules (IFR)'}
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <CloudSun size={14} color="#f59e0b" /> Temperature & Dew Point
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                  {selectedAirport.tempCelsius}°C
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Condition: {selectedAirport.condition}
                </div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <Gauge size={14} color="#8b5cf6" /> Altimeter Barometric Pressure
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                  {selectedAirport.pressureHpa} hPa
                </div>
                <div style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '2px' }}>
                  Standard Atmosphere (QNH)
                </div>
              </div>
            </div>

            {/* METAR Code Widget */}
            <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(3, 7, 18, 0.6)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                📜 Official Aviation METAR Broadcast Code
              </div>
              <code style={{ fontSize: '12px', color: '#10b981', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {generateMetar(selectedAirport)}
              </code>
            </div>
          </div>

          {/* Admin Weather Simulator Panel */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="#38bdf8" /> Weather Shift Simulator
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
              Test flight dispatch safety alerts by overriding weather parameters for {selectedAirport.airportCode}.
            </p>

            <form onSubmit={handleSimulateUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Weather Condition
                </label>
                <select
                  value={editForm.condition}
                  onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                >
                  <option value="Clear Sky">Clear Sky</option>
                  <option value="Scattered Clouds">Scattered Clouds</option>
                  <option value="Heavy Rain">Heavy Rain</option>
                  <option value="Dense Fog">Dense Fog</option>
                  <option value="Thunderstorm">Thunderstorm</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Temp (°C)
                  </label>
                  <input
                    type="number"
                    value={editForm.tempCelsius}
                    onChange={(e) => setEditForm({ ...editForm, tempCelsius: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', color: '#f8fafc', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Wind (Knots)
                  </label>
                  <input
                    type="number"
                    value={editForm.windSpeedKnots}
                    onChange={(e) => setEditForm({ ...editForm, windSpeedKnots: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', color: '#f8fafc', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Visibility (Meters)
                </label>
                <input
                  type="number"
                  value={editForm.visibilityMeters}
                  onChange={(e) => setEditForm({ ...editForm, visibilityMeters: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', color: '#f8fafc', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Aviation Safety Status Tag
                </label>
                <select
                  value={editForm.safetyStatus}
                  onChange={(e) => setEditForm({ ...editForm, safetyStatus: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                >
                  <option value="SAFE_TO_FLY">SAFE_TO_FLY (Normal Flight Ops)</option>
                  <option value="CAUTION_HIGH_WINDS">CAUTION_HIGH_WINDS (Wind Warning)</option>
                  <option value="DELAYED_DENSE_FOG">DELAYED_DENSE_FOG (Fog Delay)</option>
                  <option value="REROUTE_THUNDERSTORM">REROUTE_THUNDERSTORM (Storm Diversion)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={updating}
                style={{
                  marginTop: '10px',
                  padding: '10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: updating ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCw size={14} /> {updating ? 'Updating...' : 'Update & Broadcast Weather Status'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
