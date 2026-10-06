import React, { useState, useEffect } from 'react';
import { 
  User, Plane, Calendar, Clock, MapPin, ShieldCheck, Users, 
  CheckCircle, AlertCircle, RefreshCw, FileText, Award, Phone, Mail, LogOut, CloudSun, Wind
} from 'lucide-react';
import { api } from './api';

export default function CrewPortal({ user, onLogout }) {
  const [crewProfile, setCrewProfile] = useState(null);
  const [assignedFlights, setAssignedFlights] = useState([]);
  const [rosterMap, setRosterMap] = useState({}); // flightId -> array of crew members
  const [weatherMap, setWeatherMap] = useState({}); // airportCode -> weather object
  const [loading, setLoading] = useState(true);
  const [checkedInFlights, setCheckedInFlights] = useState({});

  const loadCrewData = async () => {
    setLoading(true);
    try {
      // 1. Fetch crew directory to match logged in user profile
      const crewRes = await api.getCrewMembers();
      if (crewRes.success && crewRes.crew.length > 0) {
        let match = crewRes.crew.find(c => c.email?.toLowerCase() === user?.email?.toLowerCase());
        if (!match) match = crewRes.crew[0]; // Default demo profile
        setCrewProfile(match);

        // 2. Fetch all flight assignments
        const assignmentsRes = await api.getCrewAssignments();
        const flightsRes = await api.getAdminFlights();

        if (assignmentsRes.success && flightsRes.success) {
          const myAssignments = assignmentsRes.assignments.filter(a => a.crewId === match.id);
          const flightIds = myAssignments.map(a => a.flightId);
          const myFlightObjs = flightsRes.flights.filter(f => flightIds.includes(f.id));
          setAssignedFlights(myFlightObjs);

          // Build full team roster map for each flight
          const rosterTemp = {};
          for (const fId of flightIds) {
            const flightCrewRes = await api.getFlightCrew(fId);
            if (flightCrewRes.success) {
              rosterTemp[fId] = flightCrewRes.assignedCrew;
            }
          }
          setRosterMap(rosterTemp);
        }

        // 3. Fetch weather telemetry
        const weatherRes = await api.getWeather();
        if (weatherRes.success) {
          const weatherMapTemp = {};
          weatherRes.weather.forEach(w => {
            weatherMapTemp[w.airportCode] = w;
          });
          setWeatherMap(weatherMapTemp);
        }
      }
    } catch (err) {
      console.error('Error loading crew portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrewData();
  }, [user]);

  const handleCheckIn = (flightId) => {
    setCheckedInFlights(prev => ({ ...prev, [flightId]: true }));
    alert('✅ Pre-flight Duty Check-In successful! Operations & Dispatch notified.');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Top Welcome & Profile Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', opacity: 0.08 }}>
          <Plane size={240} color="#38bdf8" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
            }}>
              {crewProfile?.gender === 'Female' ? '👩' : '👨'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc' }}>
                  {crewProfile?.name || user?.name || 'Flight Crew Member'}
                </h1>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.4)'
                }}>
                  {crewProfile?.role || 'Crew Staff'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '13px', color: '#94a3b8' }}>
                <span>ID: <strong style={{ color: '#f8fafc' }}>{crewProfile?.employeeId || 'CRW-101'}</strong></span>
                <span>•</span>
                <span>Status: <strong style={{ color: '#10b981' }}>{crewProfile?.status || 'Active Duty'}</strong></span>
                <span>•</span>
                <span>Gender: <strong style={{ color: crewProfile?.gender === 'Female' ? '#ec4899' : '#38bdf8' }}>{crewProfile?.gender}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={loadCrewData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} /> Sync Duty Roster
            </button>
            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#f43f5e',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Duty Roster Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} color="#38bdf8" /> My Assigned Flight Duty Schedule
          </h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            Showing {assignedFlights.length} upcoming active flights
          </span>
        </div>

        {loading ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Loading your flight schedule and roster details...
          </div>
        ) : assignedFlights.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <AlertCircle size={36} color="#f59e0b" style={{ marginBottom: '10px' }} />
            <div>No active flight assignments found for your profile today.</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Check back soon or contact Flight Operations Dispatch.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {assignedFlights.map(flight => {
              const isCheckedIn = checkedInFlights[flight.id];
              const flightTeam = rosterMap[flight.id] || [];

              return (
                <div key={flight.id} className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #38bdf8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#38bdf8' }}>
                          {flight.flightNumber}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981'
                        }}>
                          {flight.status || 'Scheduled Departure'}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                        {flight.source} ✈️ {flight.destination}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                        📅 Date: {flight.departureDate}
                      </div>
                      <div style={{ fontSize: '12px', color: '#38bdf8', marginTop: '2px', fontWeight: 600 }}>
                        ⏰ Departure: {flight.departureTime} (Arrival: {flight.arrivalTime})
                      </div>
                    </div>
                  </div>

                  {/* Flight Overview Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Aircraft Type</span>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                        {flight.aircraft}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Distance & Route</span>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                        {flight.distance} KM
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Passengers / Seats</span>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                        {flight.totalSeats - flight.availableSeats} / {flight.totalSeats} Pax
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Est. Fuel Burn</span>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                        {flight.fuelConsumedLiters || 19.2} Liters
                      </div>
                    </div>
                  </div>

                  {/* Pre-Flight Weather & Safety Clearance Telemetry */}
                  {(() => {
                    const destCode = (flight.destination || '').includes('Mumbai') ? 'BOM' :
                                     (flight.destination || '').includes('Delhi') ? 'DEL' :
                                     (flight.destination || '').includes('Pune') ? 'PNQ' :
                                     (flight.destination || '').includes('Goa') ? 'GOI' :
                                     (flight.destination || '').includes('Hyderabad') ? 'HYD' :
                                     (flight.destination || '').includes('Bengaluru') ? 'BLR' : 'JLG';
                    const destWeather = weatherMap[destCode] || { tempCelsius: 28, condition: 'Clear Sky', windSpeedKnots: 8, visibilityMeters: 9000, safetyStatus: 'SAFE_TO_FLY' };
                    
                    return (
                      <div style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        background: 'rgba(56, 189, 248, 0.06)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <CloudSun size={24} color="#38bdf8" />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                              🌤️ Pre-Flight Weather Clearance ({destCode} - {flight.destination})
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                              Temp: {destWeather.tempCelsius}°C • Wind: {destWeather.windSpeedKnots} kts • Visibility: {destWeather.visibilityMeters}m ({destWeather.condition})
                            </div>
                          </div>
                        </div>

                        <div>
                          {destWeather.safetyStatus === 'SAFE_TO_FLY' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', fontSize: '11px', fontWeight: 700 }}>
                              <CheckCircle size={14} /> FLIGHT SAFETY CLEARED
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)', fontSize: '11px', fontWeight: 700 }}>
                              <AlertCircle size={14} /> {destWeather.safetyStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Flight Roster Team */}
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={16} color="#38bdf8" /> Assigned Flight Crew Roster Team ({flightTeam.length} Members)
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                      {flightTeam.map(member => {
                        const isMe = member.crewId === crewProfile?.id;
                        return (
                          <div
                            key={member.crewId}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '6px',
                              background: isMe ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                              border: isMe ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <div style={{ fontSize: '18px' }}>
                              {member.gender === 'Female' ? '👩' : '👨'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: isMe ? '#38bdf8' : '#f8fafc' }}>
                                {member.name} {isMe && '(You)'}
                              </div>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                {member.assignedRole || member.role} • ID: {member.employeeId}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pre-flight Check-In Action Button */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    {isCheckedIn ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#10b981' }}>
                        <CheckCircle size={16} /> Pre-Flight Duty Checked In
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(flight.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <ShieldCheck size={16} /> Perform Pre-Flight Duty Check-In
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
