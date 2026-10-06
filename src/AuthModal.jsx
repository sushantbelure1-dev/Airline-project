import React, { useState } from 'react';
import { Plane, ShieldCheck, User, Lock, Mail, ArrowRight, AlertCircle, Key, CheckCircle } from 'lucide-react';
import { api } from './api';

export default function AuthModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('ADMIN'); // 'ADMIN' or 'USER' for tab prefill
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@jalgaon.aero');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    if (selectedRole === 'ADMIN') {
      setIsRegister(false);
      setEmail('admin@jalgaon.aero');
      setPassword('Admin@12345');
    } else if (selectedRole === 'CREW') {
      setIsRegister(false);
      setEmail('priya.deshmukh@jalgaon.aero');
      setPassword('Crew@12345');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name) {
          setError('Full name is required to register.');
          setLoading(false);
          return;
        }
        const data = await api.register(name, email, password);
        if (data.success) {
          localStorage.setItem('jalgaon_airline_token', data.token);
          onLoginSuccess(data.user);
        } else {
          setError(data.message || 'Registration failed');
        }
      } else {
        if (role === 'CREW') {
          // Special fallback for crew login
          const crewObj = {
            id: 101,
            name: email.includes('rajesh') ? 'Capt. Rajesh Sharma' : 'Priya Deshmukh',
            email: email,
            role: 'CREW'
          };
          localStorage.setItem('jalgaon_airline_token', 'mock_crew_token');
          onLoginSuccess(crewObj);
          return;
        }

        const data = await api.login(email, password);
        if (data.success) {
          localStorage.setItem('jalgaon_airline_token', data.token);
          onLoginSuccess(data.user);
        } else {
          setError(data.message || 'Invalid credentials');
        }
      }
    } catch (err) {
      setError(err.message || 'Network connection failed to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.88)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '36px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 60%, #0f172a 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.4)',
            marginBottom: '14px'
          }}>
            <Plane color="#ffffff" size={30} style={{ transform: 'rotate(-45deg)' }} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Jalgaon Airline Portal
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            {isRegister ? 'Passenger Registration' : 'Select Role to Enter Portal'}
          </p>
        </div>

        {/* Role Quick Selector */}
        {!isRegister && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '8px 6px',
                borderRadius: '8px',
                border: 'none',
                background: role === 'ADMIN' ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' : 'transparent',
                color: role === 'ADMIN' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={14} /> Admin
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('USER')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '8px 6px',
                borderRadius: '8px',
                border: 'none',
                background: role === 'USER' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                color: role === 'USER' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <User size={14} /> User
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('CREW')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '8px 6px',
                borderRadius: '8px',
                border: 'none',
                background: role === 'CREW' ? 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' : 'transparent',
                color: role === 'CREW' ? '#ffffff' : '#94a3b8',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              👩 Crew / Pilot
            </button>
          </div>
        )}


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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 38px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                  placeholder="e.g. Rahul Sharma"
                />
                <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none'
                }}
                placeholder="name@email.com"
              />
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 38px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '13px',
                  outline: 'none'
                }}
                placeholder="••••••••"
              />
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '14px' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: role === 'ADMIN'
                ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)'
                : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
            }}
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'Create Account' : `Sign In as ${role}`}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Switch Login / Register for Passengers */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
          {isRegister ? (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(false); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#38bdf8', fontWeight: 700, cursor: 'pointer' }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New passenger?{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(true); setRole('USER'); setError(''); setEmail(''); setPassword(''); }}
                style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer' }}
              >
                Register Here
              </button>
            </span>
          )}
        </div>

        {/* Admin Quick Credentials Info */}
        {!isRegister && role === 'ADMIN' && (
          <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '11px', color: '#cbd5e1' }}>
            <strong>Admin Login:</strong> admin@jalgaon.aero / Admin@12345
          </div>
        )}
      </div>
    </div>
  );
}
