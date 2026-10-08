import React, { useState, useEffect } from 'react';
import { Plane, ShieldCheck, User as UserIcon, LogOut, Database } from 'lucide-react';
import { api } from './api';
import AuthModal from './AuthModal';
import AdminDashboard from './AdminDashboard';
import UserPortal from './UserPortal';
import CrewPortal from './CrewPortal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Check persistent session on mount
  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('jalgaon_airline_token');
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setCurrentUser(res.user);
          } else {
            localStorage.removeItem('jalgaon_airline_token');
          }
        } catch {
          localStorage.removeItem('jalgaon_airline_token');
        }
      }
      setLoadingUser(false);
    }
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jalgaon_airline_token');
    setCurrentUser(null);
  };

  if (loadingUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ color: '#38bdf8', fontWeight: 600 }}>Initializing Jalgaon Airline System...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Application Header */}
      <header style={{
        background: 'rgba(11, 19, 41, 0.96)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '12px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo and Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
          }}>
            <Plane color="#ffffff" size={22} style={{ transform: 'rotate(-45deg)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                JALGAON AIRLINES
              </h1>
              <span className="badge-ontime">
                JLG AIRPORT HUB
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#94a3b8' }}>
              Commercial Operations, Dynamic Fare Engine & Passenger Portal
            </p>
          </div>
        </div>

        {/* Live Flight Information Ticker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255, 255, 255, 0.04)', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '11px' }}>
          <span style={{ color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            ✈️ FLIGHT STATUS:
          </span>
          <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#fff' }}>JLG ➔ BOM:</strong> <span style={{ color: '#34d399' }}>ON TIME</span></span>
          <span style={{ color: '#475569' }}>|</span>
          <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#fff' }}>JLG ➔ DEL:</strong> <span style={{ color: '#38bdf8' }}>BOARDING</span></span>
          <span style={{ color: '#475569' }}>|</span>
          <span style={{ color: '#cbd5e1' }}><strong style={{ color: '#fff' }}>JLG ➔ PNQ:</strong> <span style={{ color: '#34d399' }}>ON TIME</span></span>
        </div>

        {/* Database & Active User Role Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={13} color="#38bdf8" />
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
              {typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? 'Cloud Production Server' : 'SQLite Server Active'}
            </span>
          </div>

          {currentUser ? (
            <div className="glass-panel" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                padding: '5px',
                borderRadius: '6px',
                background: currentUser.role === 'ADMIN' ? 'rgba(56, 189, 248, 0.15)' :
                            currentUser.role === 'CREW' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: currentUser.role === 'ADMIN' ? '#38bdf8' :
                       currentUser.role === 'CREW' ? '#ec4899' : '#10b981'
              }}>
                {currentUser.role === 'ADMIN' ? <ShieldCheck size={16} /> : <UserIcon size={16} />}
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>{currentUser.name}</div>
                <div style={{ fontSize: '10px', color: currentUser.role === 'ADMIN' ? '#38bdf8' : currentUser.role === 'CREW' ? '#ec4899' : '#10b981', fontWeight: 700 }}>
                  {currentUser.role === 'CREW' ? 'FLIGHT CREW / PILOT' : currentUser.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentUser({ role: 'GUEST' })}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>


      {/* Main Body: 3-Panel Role Routing */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!currentUser ? (
          <AuthModal onLoginSuccess={(u) => setCurrentUser(u)} />
        ) : currentUser.role === 'ADMIN' ? (
          <AdminDashboard onLogout={handleLogout} />
        ) : currentUser.role === 'CREW' ? (
          <CrewPortal user={currentUser} onLogout={handleLogout} />
        ) : (
          <UserPortal user={currentUser} onLogout={handleLogout} />
        )}
      </div>


      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '12px 28px',
        background: 'rgba(7, 11, 20, 0.95)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: '#64748b'
      }}>
        <div>Jalgaon Airline • Enterprise Flight Booking, Distance-Based Pricing & Ticketing System</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Role-Based Access Control</span>
          <span>Automatic GPS Distance Calculation</span>
          <span>Verified QR Boarding Passes</span>
        </div>
      </footer>
    </div>
  );
}
