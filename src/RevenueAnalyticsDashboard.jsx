import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Calendar, Filter, Users, Plane, 
  ArrowUpRight, BarChart2, PieChart, Download, FileText
} from 'lucide-react';
import { api } from './api';

export default function RevenueAnalyticsDashboard() {
  const [period, setPeriod] = useState('all'); // 'today', '7days', '30days', '3months', 'all'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getRevenueAnalytics(period);
      if (res.success) {
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.error('Revenue analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleExportCSV = () => {
    if (!analytics?.flightsPerformance) return;
    const headers = "Flight,Route,Aircraft,Total Seats,Booked Seats,Occupancy %,Revenue (Rs),CO2 (kg)\n";
    const rows = analytics.flightsPerformance.map(f => 
      `"${f.flightNumber}","${f.source} -> ${f.destination}","${f.aircraft}",${f.totalSeats},${f.bookedPax},${f.occupancy}%,${f.revenue},${f.totalEstimatedCo2Kg}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Revenue_Report_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading && !analytics) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Aggregating revenue analytics...</div>;
  }

  const { kpis, routeRevenue, revenueOverTime, flightsPerformance } = analytics || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
            Revenue & Yield Performance Analytics
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Comprehensive financial KPIs, route yield distribution & passenger booking trends
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleExportCSV}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} /> Export CSV Report
          </button>

          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: '3months', label: 'Last 3 Months' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: period === tab.id ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' : 'transparent',
                  color: period === tab.id ? '#ffffff' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: period === tab.id ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Revenue</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '6px' }} className="mono-num">
            Rs {Number(kpis?.totalRevenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Today: Rs {Number(kpis?.todayRevenue || 0).toLocaleString()}</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Average Ticket Price</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }} className="mono-num">
            Rs {Number(kpis?.avgTicketPrice || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Per confirmed passenger</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Avg Revenue / Flight</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginTop: '6px' }} className="mono-num">
            Rs {Number(kpis?.avgRevPerFlight || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Across active schedules</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Average Occupancy</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b', marginTop: '6px' }} className="mono-num">
            {kpis?.avgOccupancy}%
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Fleet seat utilization</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Total Passengers</span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#818cf8', marginTop: '6px' }} className="mono-num">
            {kpis?.totalPassengers}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>{kpis?.totalBookings} total bookings</div>
        </div>
      </div>

      {/* Grid: Route Revenue Breakdown & Trend Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Route Revenue Ranking */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
            Top Revenue Generating Routes
          </h4>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
            Route performance sorted by gross booking turnover
          </p>

          {routeRevenue?.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No route bookings recorded for this period.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {routeRevenue?.map((r, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>{r.route}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {r.passengers} Passengers • {r.bookingsCount} Bookings • Avg Fare: Rs {Math.round(r.avgFare).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }} className="mono-num">
                      Rs {Number(r.revenue).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flight Performance Ledger */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
            Flight Revenue & Carbon Matrix
          </h4>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>
            Combined financial & environmental yield telemetry
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            {flightsPerformance?.map(f => (
              <div
                key={f.id}
                style={{
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '13px' }}>{f.flightNumber}</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }} className="mono-num">
                    Rs {Number(f.revenue).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                  <span>{f.source} → {f.destination}</span>
                  <span>Occupancy: <strong style={{ color: f.occupancy > 70 ? '#10b981' : '#f59e0b' }}>{f.occupancy}%</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                  <span>Fare: Rs {Number(f.calculatedPrice).toLocaleString()}</span>
                  <span>CO₂/Pax: <strong style={{ color: '#38bdf8' }}>{f.co2PerPax} kg</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
