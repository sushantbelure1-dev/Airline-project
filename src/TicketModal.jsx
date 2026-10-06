import React, { useRef } from 'react';
import { Plane, Calendar, Clock, MapPin, QrCode, Download, Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

export default function TicketModal({ ticket, onClose }) {
  const printRef = useRef(null);

  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const ticketText = `
==============================================
           JALGAON AIRLINE BOARDING PASS
==============================================
PNR: ${ticket.pnr}
Booking ID: ${ticket.bookingId}
Ticket ID: ${ticket.ticketId}
Status: ${ticket.status}

Flight: ${ticket.flightNumber} (${ticket.airline})
Aircraft: ${ticket.aircraft}
Route: ${ticket.source} -> ${ticket.destination}

Departure: ${ticket.departureDate} at ${ticket.departureTime}
Arrival: ${ticket.arrivalDate} at ${ticket.arrivalTime}

Passengers (${ticket.passengerCount || ticket.passengers?.length}):
${ticket.passengers?.map((p, idx) => ` ${idx + 1}. ${p.name} (${p.gender}, Age ${p.age}) - Seat: ${p.seatNumber || 'Assigned at check-in'}`).join('\n')}

Fare per Passenger: Rs ${Number(ticket.pricePerPassenger || 0).toLocaleString()}
Total Amount: Rs ${Number(ticket.totalAmount || 0).toLocaleString()}
==============================================
`;
    const element = document.createElement("a");
    const file = new Blob([ticketText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Ticket_${ticket.pnr}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '820px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#0d1527',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(56, 189, 248, 0.2)',
        position: 'relative'
      }}>
        {/* Header Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle size={13} /> {ticket.status || 'CONFIRMED'}
            </span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>PNR: <strong style={{ color: '#f8fafc' }}>{ticket.pnr}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#e2e8f0',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={14} /> Download E-Ticket
            </button>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} /> Print Ticket
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Ticket Body */}
        <div ref={printRef} style={{ padding: '28px' }}>
          {/* Airline Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '20px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plane color="#38bdf8" size={24} style={{ transform: 'rotate(-45deg)' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                    JALGAON AIRLINE
                  </h3>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Official Electronic Boarding Pass & Travel Confirmation
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Booking Identifier</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }} className="mono-num">{ticket.bookingId}</div>
              </div>
            </div>

            {/* Route & Times */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 0.8fr 1.2fr',
              alignItems: 'center',
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>ORIGIN / DEPARTURE</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>{ticket.source}</div>
                <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>{ticket.departureDate} at {ticket.departureTime}</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>{ticket.flightNumber}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ height: '2px', flex: 1, background: 'rgba(56, 189, 248, 0.4)' }} />
                  <Plane size={16} color="#38bdf8" />
                  <span style={{ height: '2px', flex: 1, background: 'rgba(56, 189, 248, 0.4)' }} />
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{ticket.airline}</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>DESTINATION / ARRIVAL</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>{ticket.destination}</div>
                <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600, marginTop: '2px' }}>{ticket.arrivalDate} at {ticket.arrivalTime}</div>
              </div>
            </div>
          </div>

          {/* Passenger & QR Code Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '14px' }}>
                Passenger Manifest ({ticket.passengerCount || ticket.passengers?.length || 1})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ticket.passengers?.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.04)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '13px' }}>
                        {idx + 1}. {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {p.gender} • Age: {p.age} {p.email ? `• ${p.email}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>SEAT</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }} className="mono-num">
                        {p.seatNumber || '04B'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code Verification Panel */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              {ticket.qrCodeData ? (
                <img
                  src={ticket.qrCodeData}
                  alt="Boarding QR Code"
                  style={{ width: '130px', height: '130px', borderRadius: '10px', background: '#fff', padding: '6px' }}
                />
              ) : (
                <div style={{ width: '130px', height: '130px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode size={80} color="#000" />
                </div>
              )}
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginTop: '12px' }}>
                Gate Scan Verified
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                Airport Gate & Security Pass
              </div>
            </div>
          </div>

          {/* Pricing & Guarantee Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '12px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Fare per Passenger: Rs {Number(ticket.pricePerPassenger || 0).toLocaleString()}</div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Inclusive of Fuel Charge, Distance Tariff & Applicable Aviation Tax</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Amount Paid</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8' }} className="mono-num">
                Rs {Number(ticket.totalAmount || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Environmental Sustainability Badge */}
          <div style={{
            padding: '14px 18px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🌱</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                  Estimated Carbon Footprint: {ticket.estimatedCo2PerPaxKg || '42.8'} kg CO₂ per passenger
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  This is an estimated value calculated using flight distance, aircraft fuel burn, and the configured emission factor. Actual emissions may vary based on weather and aircraft payload.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
