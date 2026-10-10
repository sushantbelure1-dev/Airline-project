import React, { useState, useMemo } from 'react';
import { 
  Plane, Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle, 
  AlertCircle, DollarSign, Fuel, ShieldAlert, X, CreditCard, QrCode, Building, Lock
} from 'lucide-react';
import { api } from './api';

export default function BookingModal({ flight, user, onClose, onBookingSuccess }) {
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Class & Seats, 2: Passengers, 3: Payment
  const [selectedClass, setSelectedClass] = useState('Economy'); // 'Economy', 'Business', 'First Class'
  const [selectedSeats, setSelectedSeats] = useState([]); // e.g. ['6A', '6B']
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  const [passengers, setPassengers] = useState([
    { name: user?.name || '', age: 28, gender: 'Male', email: user?.email || '', phone: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Class Configuration & Dynamic Pricing Multiplier
  const baseFare = flight.calculatedPrice || flight.price || 2500;
  const classConfig = {
    'Economy': {
      label: 'Economy Class',
      multiplier: 1.0,
      badgeColor: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      icon: '💺',
      rows: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      colsLeft: ['A', 'B', 'C'],
      colsRight: ['D', 'E', 'F'],
      baggage: '15 kg Check-in + 7 kg Hand'
    },
    'Business': {
      label: 'Business Class',
      multiplier: 1.5,
      badgeColor: '#38bdf8',
      bgColor: 'rgba(56, 189, 248, 0.08)',
      borderColor: 'rgba(56, 189, 248, 0.3)',
      icon: '🥂',
      rows: [3, 4, 5],
      colsLeft: ['A', 'B'],
      colsRight: ['C', 'D'],
      baggage: '30 kg Check-in + Priority Boarding'
    },
    'First Class': {
      label: 'First Class VIP',
      multiplier: 2.0,
      badgeColor: '#a855f7',
      bgColor: 'rgba(168, 85, 247, 0.08)',
      borderColor: 'rgba(168, 85, 247, 0.3)',
      icon: '👑',
      rows: [1, 2],
      colsLeft: ['A', 'B'],
      colsRight: ['C', 'D'],
      baggage: '40 kg Check-in + VIP Lounge Access'
    }
  };

  const currentClassInfo = classConfig[selectedClass];
  const pricePerPassenger = Math.round(baseFare * currentClassInfo.multiplier);
  const totalAmount = pricePerPassenger * passengers.length;

  // Generate deterministic booked seats based on flight.id for visual accuracy
  const bookedSeatSet = useMemo(() => {
    const seed = (flight.id || 101) * 31;
    const booked = new Set();
    const allCols = ['A', 'B', 'C', 'D', 'E', 'F'];
    // Mark ~35% seats as red booked
    for (let r = 1; r <= 15; r++) {
      for (const c of allCols) {
        const val = (r * 17 + c.charCodeAt(0) + seed) % 100;
        if (val < 38) {
          booked.add(`${r}${c}`);
        }
      }
    }
    return booked;
  }, [flight.id]);

  const handleSeatClick = (seatCode, isBooked) => {
    if (isBooked) return; // Cannot select booked seat

    if (selectedSeats.includes(seatCode)) {
      // Unselect seat
      setSelectedSeats(prev => prev.filter(s => s !== seatCode));
    } else {
      // Check seat limit based on passenger count
      if (selectedSeats.length >= passengers.length) {
        // Replace first selected seat or alert
        if (passengers.length === 1) {
          setSelectedSeats([seatCode]);
        } else {
          alert(`You have selected ${passengers.length} passenger(s). Add another passenger to select more seats.`);
        }
      } else {
        setSelectedSeats(prev => [...prev, seatCode]);
      }
    }
  };

  const addPassenger = () => {
    setPassengers(prev => [
      ...prev,
      { name: '', age: 25, gender: 'Female', email: '', phone: '' }
    ]);
  };

  const removePassenger = (index) => {
    if (passengers.length <= 1) return;
    setPassengers(prev => prev.filter((_, i) => i !== index));
    if (selectedSeats.length > passengers.length - 1) {
      setSelectedSeats(prev => prev.slice(0, passengers.length - 1));
    }
  };

  const updatePassenger = (index, field, value) => {
    setPassengers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleNextToPassengers = () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least 1 seat on the aircraft map before proceeding.');
      return;
    }
    setError('');
    setCheckoutStep(2);
  };

  const handleNextToPayment = () => {
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].name.trim()) {
        setError(`Please enter full name for Passenger #${i + 1}`);
        return;
      }
    }
    setError('');
    setCheckoutStep(3);
  };

  const handleConfirmBookingAndPay = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Attach chosen seat numbers to passengers
    const passengersWithSeats = passengers.map((p, idx) => ({
      ...p,
      seatNumber: selectedSeats[idx] || `${6 + idx}A`
    }));

    try {
      const data = await api.createBooking(flight.id, passengersWithSeats, selectedClass);
      if (data.success) {
        onBookingSuccess(data.ticket);
      } else {
        setError(data.message || 'Booking & Payment processing failed');
      }
    } catch (err) {
      setError(err.message || 'Error executing booking transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.92)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1500,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '820px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '28px',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '24px',
        position: 'relative'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.05em'
            }}>
              Commercial Aircraft Reservation
            </span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '6px' }}>
              Flight {flight.flightNumber}: {flight.source} → {flight.destination}
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              {flight.airline} • {flight.aircraft} • Departure: <strong style={{ color: '#38bdf8' }}>{flight.departureTime}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Multi-Step Checkout Breadcrumb Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '6px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => setCheckoutStep(1)}
            style={{
              padding: '10px 8px',
              borderRadius: '8px',
              border: 'none',
              background: checkoutStep === 1 ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' : 'transparent',
              color: checkoutStep === 1 ? '#ffffff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>1. Class & Seats</span>
            {selectedSeats.length > 0 && <CheckCircle size={14} color="#ffffff" />}
          </button>

          <button
            type="button"
            onClick={() => { if (selectedSeats.length > 0) setCheckoutStep(2); }}
            style={{
              padding: '10px 8px',
              borderRadius: '8px',
              border: 'none',
              background: checkoutStep === 2 ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' : 'transparent',
              color: checkoutStep === 2 ? '#ffffff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>2. Passenger Info</span>
          </button>

          <button
            type="button"
            onClick={() => { if (selectedSeats.length > 0 && passengers[0].name) setCheckoutStep(3); }}
            style={{
              padding: '10px 8px',
              borderRadius: '8px',
              border: 'none',
              background: checkoutStep === 3 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: checkoutStep === 3 ? '#ffffff' : '#94a3b8',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <CreditCard size={14} />
            <span>3. Payment Gateway</span>
          </button>
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
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* STEP 1: TRAVEL CLASS & INTERACTIVE VISUAL SEAT MAP */}
        {checkoutStep === 1 && (
          <div>
            {/* Travel Class Tiers */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: '#e2e8f0', display: 'block', marginBottom: '10px' }}>
                Select Travel Class Category
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {Object.keys(classConfig).map((cKey) => {
                  const c = classConfig[cKey];
                  const isSelected = selectedClass === cKey;
                  const fare = Math.round(baseFare * c.multiplier);

                  return (
                    <div
                      key={cKey}
                      onClick={() => {
                        setSelectedClass(cKey);
                        setSelectedSeats([]); // Reset seats on class switch
                      }}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: isSelected ? c.bgColor : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? `2px solid ${c.badgeColor}` : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '18px' }}>{c.icon}</span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: isSelected ? c.badgeColor : 'rgba(255, 255, 255, 0.1)',
                          color: isSelected ? '#000000' : '#94a3b8'
                        }}>
                          {cKey}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', marginTop: '6px' }}>
                        {c.label}
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: 800, color: c.badgeColor, marginTop: '2px' }} className="mono-num">
                        Rs {fare.toLocaleString()} <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>/ seat</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seat Map Legend Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '14px',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700 }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#10b981', display: 'inline-block' }}></span>
                  Available Seat (Green)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontWeight: 700 }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#f43f5e', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 900 }}>✕</span>
                  Booked Seat (Red Cross)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 700 }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: '#38bdf8', display: 'inline-block' }}></span>
                  Your Selected Seat
                </span>
              </div>

              <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                Selected: <strong style={{ color: '#38bdf8' }}>{selectedSeats.join(', ') || 'None'}</strong>
              </div>
            </div>

            {/* VISUAL AIRCRAFT CABIN FUSELAGE MAP */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8) 0%, rgba(3, 7, 18, 0.95) 100%)',
              border: '2px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '40px 40px 16px 16px',
              padding: '24px 20px',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '20px'
            }}>
              {/* Cockpit Front Header */}
              <div style={{ textAlign: 'center', marginBottom: '16px', color: '#64748b', fontSize: '11px', fontWeight: 700, letterSpacing: '2px' }}>
                ✈️ AIRCRAFT COCKPIT FRONT (FORWARD NOSE)
              </div>

              {/* Rows Seat Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentClassInfo.rows.map((rowNum) => (
                  <div key={rowNum} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    {/* Row Label */}
                    <div style={{ width: '28px', textAlign: 'right', fontSize: '12px', fontWeight: 800, color: '#94a3b8' }}>
                      R{rowNum}
                    </div>

                    {/* Left Seat Column Group */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {currentClassInfo.colsLeft.map((col) => {
                        const seatCode = `${rowNum}${col}`;
                        const isBooked = bookedSeatSet.has(seatCode);
                        const isSelected = selectedSeats.includes(seatCode);

                        return (
                          <button
                            key={seatCode}
                            type="button"
                            onClick={() => handleSeatClick(seatCode, isBooked)}
                            disabled={isBooked}
                            title={isBooked ? `Seat ${seatCode} is Booked` : `Seat ${seatCode} (Available)`}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #ffffff' : 'none',
                              background: isBooked
                                ? '#f43f5e' // Red booked
                                : isSelected
                                ? '#0284c7' // Selected blue
                                : '#10b981', // Green available
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '11px',
                              cursor: isBooked ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.6)' : 'none',
                              transition: 'transform 0.15s ease'
                            }}
                          >
                            <span>{seatCode}</span>
                            <span style={{ fontSize: '10px', marginTop: '-2px' }}>
                              {isBooked ? '✕' : isSelected ? '✓' : '💺'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* AISLE PASSAGEWAY */}
                    <div style={{
                      width: '36px',
                      textAlign: 'center',
                      fontSize: '10px',
                      color: '#475569',
                      fontWeight: 700,
                      borderLeft: '1px dashed rgba(255,255,255,0.1)',
                      borderRight: '1px dashed rgba(255,255,255,0.1)',
                      padding: '4px 0'
                    }}>
                      AISLE
                    </div>

                    {/* Right Seat Column Group */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {currentClassInfo.colsRight.map((col) => {
                        const seatCode = `${rowNum}${col}`;
                        const isBooked = bookedSeatSet.has(seatCode);
                        const isSelected = selectedSeats.includes(seatCode);

                        return (
                          <button
                            key={seatCode}
                            type="button"
                            onClick={() => handleSeatClick(seatCode, isBooked)}
                            disabled={isBooked}
                            title={isBooked ? `Seat ${seatCode} is Booked` : `Seat ${seatCode} (Available)`}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #ffffff' : 'none',
                              background: isBooked
                                ? '#f43f5e' // Red booked
                                : isSelected
                                ? '#0284c7' // Selected blue
                                : '#10b981', // Green available
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '11px',
                              cursor: isBooked ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isSelected ? '0 0 15px rgba(56, 189, 248, 0.6)' : 'none',
                              transition: 'transform 0.15s ease'
                            }}
                          >
                            <span>{seatCode}</span>
                            <span style={{ fontSize: '10px', marginTop: '-2px' }}>
                              {isBooked ? '✕' : isSelected ? '✓' : '💺'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1 Action Footer */}
            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>
                  Total Fare: Rs {totalAmount.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {selectedSeats.length} seat(s) selected ({selectedSeats.join(', ') || 'Select on map above'})
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextToPassengers}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Proceed to Passenger Info</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PASSENGER DETAILS FORM */}
        {checkoutStep === 2 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#e2e8f0' }}>Passenger Details Form</h4>
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
                  fontWeight: 700
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
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
                      Passenger #{idx + 1} • Assigned Seat: <strong style={{ color: '#10b981' }}>{selectedSeats[idx] || `Seat ${idx + 1}`}</strong>
                    </span>
                    {passengers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePassenger(idx)}
                        style={{ background: 'none', border: 'none', color: '#f43f5e', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
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
                        placeholder="e.g. Rahul Patil"
                        value={p.name}
                        onChange={(e) => updatePassenger(idx, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
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
                          padding: '10px',
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
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Gender</label>
                      <select
                        value={p.gender}
                        onChange={(e) => updatePassenger(idx, 'gender', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: '#0d1527',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '13px',
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
                        placeholder="passenger@example.com"
                        value={p.email}
                        onChange={(e) => updatePassenger(idx, 'email', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
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
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98220 12345"
                        value={p.phone}
                        onChange={(e) => updatePassenger(idx, 'phone', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
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
                </div>
              ))}
            </div>

            {/* Step 2 Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCheckoutStep(1)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                ← Back to Seat Selection
              </button>

              <button
                type="button"
                onClick={handleNextToPayment}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Proceed to Payment Gateway</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: INTEGRATED PAYMENT GATEWAY */}
        {checkoutStep === 3 && (
          <form onSubmit={handleConfirmBookingAndPay}>
            <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 800 }}>PAYMENT SUMMARY</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }} className="mono-num">
                    Total Amount: Rs {totalAmount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {passengers.length} Pax • {selectedClass} • Seats: {selectedSeats.join(', ')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 800 }}>
                    🔒 SSL Secured Checkout
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Select Payment Option</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: paymentMethod === 'upi' ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'upi' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    color: paymentMethod === 'upi' ? '#ffffff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <QrCode size={16} /> UPI / QR Code
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: paymentMethod === 'card' ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'card' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    color: paymentMethod === 'card' ? '#ffffff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CreditCard size={16} /> Credit/Debit Card
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: paymentMethod === 'netbanking' ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'netbanking' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    color: paymentMethod === 'netbanking' ? '#ffffff' : '#94a3b8',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Building size={16} /> Net Banking
                </button>
              </div>
            </div>

            {/* Payment Details Container */}
            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
              {paymentMethod === 'upi' && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                    Scan QR Code or Enter UPI ID (GPay / PhonePe / Paytm)
                  </div>
                  <div style={{
                    width: '130px',
                    height: '130px',
                    margin: '0 auto 12px auto',
                    background: '#ffffff',
                    padding: '8px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {/* Simulated Clean QR Code */}
                    <div style={{ width: '100%', height: '100%', border: '4px solid #000', background: '#fff', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '4px' }}>
                      <div style={{ background: '#000' }}></div>
                      <div style={{ background: '#fff' }}></div>
                      <div style={{ background: '#000' }}></div>
                      <div style={{ background: '#000' }}></div>
                      <div style={{ background: '#000' }}></div>
                      <div style={{ background: '#000' }}></div>
                      <div style={{ background: '#fff' }}></div>
                      <div style={{ background: '#000' }}></div>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter UPI ID (e.g. 9822012345@upi)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{
                      maxWidth: '300px',
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#38bdf8',
                      textAlign: 'center',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}
                  />
                </div>
              )}

              {paymentMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Card Number</label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4532 •••• •••• 8892"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Expiry (MM/YY)</label>
                      <input
                        type="text"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
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
                      <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>CVV</label>
                      <input
                        type="password"
                        maxLength={3}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
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
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Select Preferred Bank</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {['State Bank of India (SBI)', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'].map((bName) => (
                      <button
                        key={bName}
                        type="button"
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-subtle)',
                          color: '#f8fafc',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        🏦 {bName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3 Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCheckoutStep(2)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                ← Back to Passenger Details
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px 28px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: loading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Lock size={16} />
                <span>{loading ? 'Processing Payment & Ticket...' : `Pay Rs ${totalAmount.toLocaleString()} & Issue Ticket`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
