import React, { useState, useEffect } from 'react';
import { Plane, Calendar, Clock, MapPin, Users, Fuel, DollarSign, PlusCircle, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from './api';

export default function AddFlightForm({ onFlightAdded, editingFlight, onCancelEdit }) {
  const [formData, setFormData] = useState({
    flightNumber: '',
    airline: 'Jalgaon Airline',
    aircraft: 'ATR 72-600',
    source: 'Jalgaon (JLG)',
    destination: 'Mumbai (BOM)',
    departureDate: new Date().toISOString().slice(0, 10),
    departureTime: '08:30',
    arrivalDate: new Date().toISOString().slice(0, 10),
    arrivalTime: '09:45',
    totalSeats: 72,
    distance: 350,
    status: 'ACTIVE'
  });

  const [airports, setAirports] = useState([]);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre-fill if editing
  useEffect(() => {
    if (editingFlight) {
      setFormData({
        flightNumber: editingFlight.flightNumber,
        airline: editingFlight.airline,
        aircraft: editingFlight.aircraft,
        source: editingFlight.source,
        destination: editingFlight.destination,
        departureDate: editingFlight.departureDate,
        departureTime: editingFlight.departureTime,
        arrivalDate: editingFlight.arrivalDate,
        arrivalTime: editingFlight.arrivalTime,
        totalSeats: editingFlight.totalSeats,
        distance: editingFlight.distance,
        status: editingFlight.status
      });
    }
  }, [editingFlight]);

  // Load airports and pricing config
  useEffect(() => {
    async function init() {
      try {
        const [airportsRes, configRes] = await Promise.all([
          api.getAirports(),
          api.getPricingConfig()
        ]);
        if (airportsRes.success) setAirports(airportsRes.airports);
        if (configRes.success) setPricingConfig(configRes.config);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  // Recalculate automatic distance when source or destination changes
  useEffect(() => {
    async function updateDistance() {
      if (formData.source && formData.destination && formData.source !== formData.destination) {
        try {
          const res = await api.calculateDistance(formData.source, formData.destination);
          if (res.success && res.distance) {
            setFormData(prev => ({ ...prev, distance: res.distance }));
          }
        } catch (err) {
          console.error('Distance calc error:', err);
        }
      }
    }
    updateDistance();
  }, [formData.source, formData.destination]);

  // Recalculate price preview
  useEffect(() => {
    if (pricingConfig && formData.distance) {
      const dist = Number(formData.distance) || 0;
      const base = Number(pricingConfig.basePrice) || 0;
      const distCost = dist * Number(pricingConfig.pricePerKm);
      const fuelCost = (dist * Number(pricingConfig.fuelConsumptionPerKm)) * Number(pricingConfig.fuelPricePerLiter);
      const subtotal = base + distCost + fuelCost + Number(pricingConfig.serviceCharge);
      const tax = subtotal * (Number(pricingConfig.taxPercentage) / 100);
      setCalculatedPrice(Math.round(subtotal + tax));
    }
  }, [formData.distance, pricingConfig]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (editingFlight) {
        const res = await api.updateFlight(editingFlight.id, formData);
        if (res.success) {
          setSuccess('Flight updated successfully in database!');
          onFlightAdded(res.flight);
        } else {
          setError(res.message || 'Failed to update flight');
        }
      } else {
        const res = await api.addFlight(formData);
        if (res.success) {
          setSuccess(`Flight ${formData.flightNumber} added successfully to live schedule!`);
          // Reset form
          setFormData({
            flightNumber: '',
            airline: 'Jalgaon Airline',
            aircraft: 'ATR 72-600',
            source: 'Jalgaon (JLG)',
            destination: 'Mumbai (BOM)',
            departureDate: new Date().toISOString().slice(0, 10),
            departureTime: '08:30',
            arrivalDate: new Date().toISOString().slice(0, 10),
            arrivalTime: '09:45',
            totalSeats: 72,
            distance: 350,
            status: 'ACTIVE'
          });
          onFlightAdded(res.flight);
        } else {
          setError(res.message || 'Failed to add flight');
        }
      }
    } catch (err) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '28px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
            {editingFlight ? `Edit Flight: ${editingFlight.flightNumber}` : 'Add New Aircraft / Flight Schedule'}
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Automatic Haversine distance, fuel rate calculation, and tariff valuation
          </p>
        </div>
        {editingFlight && (
          <button
            type="button"
            onClick={onCancelEdit}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', fontSize: '12px', marginBottom: '16px' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '12px', marginBottom: '16px' }}>
          <CheckCircle size={15} /> {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Row 1: Flight No, Airline, Aircraft */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Flight Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. JA-108"
              value={formData.flightNumber}
              onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value.toUpperCase() })}
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
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Airline *</label>
            <input
              type="text"
              required
              value={formData.airline}
              onChange={(e) => setFormData({ ...formData, airline: e.target.value })}
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
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Plane / Aircraft *</label>
            <select
              value={formData.aircraft}
              onChange={(e) => setFormData({ ...formData, aircraft: e.target.value })}
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
            >
              <option value="ATR 72-600">ATR 72-600 EcoTurbo</option>
              <option value="Airbus A320neo">Airbus A320neo</option>
              <option value="Boeing 737 MAX 8">Boeing 737 MAX 8</option>
              <option value="De Havilland Q400">De Havilland Q400</option>
              <option value="Airbus A321neo">Airbus A321neo</option>
            </select>
          </div>
        </div>

        {/* Row 2: Source, Destination, Distance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Source Airport *</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
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
            >
              {airports.map(a => (
                <option key={a.code} value={`${a.city} (${a.code})`}>
                  {a.display} - {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Destination Airport *</label>
            <select
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
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
            >
              {airports.map(a => (
                <option key={a.code} value={`${a.city} (${a.code})`}>
                  {a.display} - {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Distance (KM) *</label>
            <input
              type="number"
              min="10"
              required
              value={formData.distance}
              onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })}
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
            <span style={{ fontSize: '10px', color: '#38bdf8' }}>Auto-calculated by GPS</span>
          </div>
        </div>

        {/* Row 3: Departure Date/Time & Arrival Date/Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Departure Date *</label>
            <input
              type="date"
              required
              value={formData.departureDate}
              onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
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
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Departure Time *</label>
            <input
              type="time"
              required
              value={formData.departureTime}
              onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
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
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Arrival Date *</label>
            <input
              type="date"
              required
              value={formData.arrivalDate}
              onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
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
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Arrival Time *</label>
            <input
              type="time"
              required
              value={formData.arrivalTime}
              onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
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
        </div>

        {/* Row 4: Seats & Flight Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Total Aircraft Capacity / Seats *</label>
            <input
              type="number"
              min="10"
              max="600"
              required
              value={formData.totalSeats}
              onChange={(e) => setFormData({ ...formData, totalSeats: Number(e.target.value) })}
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
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Status *</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
            >
              <option value="ACTIVE">ACTIVE (Bookable by Passengers)</option>
              <option value="INACTIVE">INACTIVE (Hidden from Search)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {/* Live Auto Price Banner */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(56, 189, 248, 0.06)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Backend Computed Ticket Fare:</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8' }} className="mono-num">
              Rs {calculatedPrice.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Base + Distance ({formData.distance} KM) + Aircraft Fuel + Service Fee + 5% Aviation Tax
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 4px 16px rgba(56, 189, 248, 0.4)'
            }}
          >
            {loading ? 'Saving...' : editingFlight ? 'Update Flight Details' : 'Publish Flight to Schedule'}
          </button>
        </div>
      </form>
    </div>
  );
}
