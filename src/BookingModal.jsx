import React, { useState, useEffect } from 'react';
import { 
  Plane, Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle, 
  AlertCircle, DollarSign, Fuel, ShieldAlert, X
} from 'lucide-react';
import { api } from './api';

export default function BookingModal({ flight, user, onClose, onBookingSuccess }) {
  const [passengers, setPassengers] = useState([
    { name: user?.name || '', age: 28, gender: 'Male', email: user?.email || '', phone: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addPassenger = () => {
    if (passengers.length >= (flight.availableSeats || 1)) {
      alert(`Cannot exceed ${flight.availableSeats} available seat(s).`);
      return;
    }
    setPassengers(prev => [
      ...prev,
      { name: '', age: 25, gender: 'Female', email: '', phone: '' }
    ]);
  };

  const removePassenger = (index) => {
    if (passengers.length <= 1) return;
    setPassengers(prev => prev.filter((_, i) => i !== index));
  };

  const updatePassenger = (index, field, value) => {
    setPassengers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const pricePerPassenger = flight.calculatedPrice || 0;
  const totalAmount = pricePerPassenger * passengers.length;

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].name.trim()) {
        setError(`Please enter the full name for Passenger #${i + 1}`);
        return;
      }
    }

    setLoading(true);
    try {
      const data = await api.createBooking(flight.id, passengers);
      if (data.success) {
        onBookingSuccess(data.ticket);
      } else {
        setError(data.message || 'Booking confirmation failed');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with booking server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.88)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1500,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '720px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '30px',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '20px',
        position: 'relative'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700
            }}>
              Flight Reservation Checkout
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '6px' }}>
              Confirm Booking: {flight.flightNumber}
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              {flight.source} → {flight.destination} ({flight.distance} KM)
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Flight & Fare Snapshot */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Aircraft & Airline</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>{flight.airline}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>{flight.aircraft}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Schedule</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>{flight.departureDate}</div>
            <div style={{ fontSize: '11px', color: '#38bdf8' }}>{flight.departureTime} - {flight.arrivalTime}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Available Seats</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>{flight.availableSeats} Left</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Calculated Fare / Pax</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }} className="mono-num">
              Rs {pricePerPassenger.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Est. CO₂ / Pax</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
              🌱 {flight.estimatedCo2PerPaxKg || Math.round((flight.distance || 400) * 0.12)} kg CO₂
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            fontSize: '12px',
            marginBottom: '18px'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Passenger Information Form */}
        <form onSubmit={handleConfirmBooking}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>Passenger Details</h4>
            <button
              type="button"
              onClick={addPassenger}
              style={{
                fontSize: '11px',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              + Add Passenger
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            {passengers.map((p, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>Passenger #{idx + 1}</span>
                  {passengers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePassenger(idx)}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patil"
                      value={p.name}
                      onChange={(e) => updatePassenger(idx, 'name', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Age *</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      required
                      value={p.age}
                      onChange={(e) => updatePassenger(idx, 'age', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Gender</label>
                    <select
                      value={p.gender}
                      onChange={(e) => updatePassenger(idx, 'gender', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#0d1527',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Email</label>
                    <input
                      type="email"
                      placeholder="pax@example.com"
                      value={p.email}
                      onChange={(e) => updatePassenger(idx, 'email', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={p.phone}
                      onChange={(e) => updatePassenger(idx, 'phone', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Summary & Confirmation */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                Total Payable: Rs {totalAmount.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                {passengers.length} Passenger(s) × Rs {pricePerPassenger.toLocaleString()} (All taxes included)
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
              }}
            >
              <span>{loading ? 'Confirming in Database...' : 'Confirm & Generate Ticket'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
