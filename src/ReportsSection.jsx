import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, DollarSign, Activity, Leaf, 
  Calendar, CheckCircle, RefreshCw
} from 'lucide-react';
import { api } from './api';

export default function ReportsSection() {
  const [reportType, setReportType] = useState('revenue'); // 'revenue', 'operations', 'carbon'
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'revenue') {
        const res = await api.getRevenueAnalytics('all');
        if (res.success) setReportData(res.analytics?.flightsPerformance || []);
      } else if (reportType === 'operations') {
        const res = await api.getAdminFlights();
        if (res.success) setReportData(res.flights || []);
      } else if (reportType === 'carbon') {
        const res = await api.getSustainabilityAnalytics();
        if (res.success) setReportData(res.sustainability?.emissionsByRoute || []);
      }
    } catch (err) {
      console.error('Report fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleDownloadCSV = () => {
    if (reportData.length === 0) return;
    let csvContent = '';

    if (reportType === 'revenue') {
      csvContent = "Flight,Route,Aircraft,Total Seats,Booked Seats,Occupancy %,Revenue (Rs)\n" +
        reportData.map(r => `"${r.flightNumber}","${r.source} -> ${r.destination}","${r.aircraft}",${r.totalSeats},${r.bookedPax},${r.occupancy}%,${r.revenue}`).join("\n");
    } else if (reportType === 'operations') {
      csvContent = "Flight,Aircraft,Status,Seats (Avail/Total),Distance (KM),Departure,Arrival\n" +
        reportData.map(r => `"${r.flightNumber}","${r.aircraft}","${r.status}","${r.availableSeats}/${r.totalSeats}",${r.distance},"${r.departureDate} ${r.departureTime}","${r.arrivalDate} ${r.arrivalTime}"`).join("\n");
    } else if (reportType === 'carbon') {
      csvContent = "Route,Scheduled Flights,Distance (KM),Fuel Consumed (L),Total CO2 (Tonnes)\n" +
        reportData.map(r => `"${r.route}",${r.flightCount},${r.totalDistance},${r.fuelLiters},${r.co2Tonnes}`).join("\n");
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Jalgaon_Airline_${reportType.toUpperCase()}_REPORT_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
            Executive Operations & Sustainability Reports
          </h3>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Exportable compliance dossiers for DGCA, CORSIA & corporate management
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'revenue', label: 'Revenue Report' },
              { id: 'operations', label: 'Operations Report' },
              { id: 'carbon', label: 'Carbon & ESG Report' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: reportType === tab.id ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' : 'transparent',
                  color: reportType === tab.id ? '#ffffff' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: reportType === tab.id ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadCSV}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Download size={14} /> Download CSV Report
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Generating report table...</div>
      ) : reportData.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No records found to compile for this report.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#64748b', textAlign: 'left' }}>
                {reportType === 'revenue' && (
                  <>
                    <th style={{ padding: '12px' }}>FLIGHT</th>
                    <th style={{ padding: '12px' }}>ROUTE</th>
                    <th style={{ padding: '12px' }}>AIRCRAFT</th>
                    <th style={{ padding: '12px' }}>TOTAL SEATS</th>
                    <th style={{ padding: '12px' }}>BOOKED SEATS</th>
                    <th style={{ padding: '12px' }}>OCCUPANCY</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>REVENUE</th>
                  </>
                )}
                {reportType === 'operations' && (
                  <>
                    <th style={{ padding: '12px' }}>FLIGHT</th>
                    <th style={{ padding: '12px' }}>AIRCRAFT</th>
                    <th style={{ padding: '12px' }}>STATUS</th>
                    <th style={{ padding: '12px' }}>AVAILABLE / TOTAL</th>
                    <th style={{ padding: '12px' }}>DISTANCE</th>
                    <th style={{ padding: '12px' }}>DEPARTURE</th>
                    <th style={{ padding: '12px' }}>ARRIVAL</th>
                  </>
                )}
                {reportType === 'carbon' && (
                  <>
                    <th style={{ padding: '12px' }}>ROUTE</th>
                    <th style={{ padding: '12px' }}>FLIGHT COUNT</th>
                    <th style={{ padding: '12px' }}>TOTAL DISTANCE</th>
                    <th style={{ padding: '12px' }}>JET FUEL (L)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>TOTAL CO2 (TONNES)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {reportType === 'revenue' && reportData.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 800, color: '#f8fafc' }}>{r.flightNumber}</td>
                  <td style={{ padding: '14px 12px' }}>{r.source} → {r.destination}</td>
                  <td style={{ padding: '14px 12px', color: '#94a3b8' }}>{r.aircraft}</td>
                  <td style={{ padding: '14px 12px' }}>{r.totalSeats}</td>
                  <td style={{ padding: '14px 12px', fontWeight: 600 }}>{r.bookedPax}</td>
                  <td style={{ padding: '14px 12px', fontWeight: 700, color: '#38bdf8' }}>{r.occupancy}%</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, color: '#10b981' }} className="mono-num">
                    Rs {Number(r.revenue).toLocaleString()}
                  </td>
                </tr>
              ))}

              {reportType === 'operations' && reportData.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 800, color: '#f8fafc' }}>{r.flightNumber}</td>
                  <td style={{ padding: '14px 12px', color: '#94a3b8' }}>{r.aircraft}</td>
                  <td style={{ padding: '14px 12px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: r.status === 'Cancelled' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: r.status === 'Cancelled' ? '#f43f5e' : '#10b981'
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 12px' }}>{r.availableSeats} / {r.totalSeats}</td>
                  <td style={{ padding: '14px 129x' }} className="mono-num">{r.distance} KM</td>
                  <td style={{ padding: '14px 12px' }}>{r.departureDate} ({r.departureTime})</td>
                  <td style={{ padding: '14px 12px' }}>{r.arrivalDate} ({r.arrivalTime})</td>
                </tr>
              ))}

              {reportType === 'carbon' && reportData.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 700, color: '#f8fafc' }}>{r.route}</td>
                  <td style={{ padding: '14px 12px' }}>{r.flightCount} Flights</td>
                  <td style={{ padding: '14px 12px' }} className="mono-num">{r.totalDistance} KM</td>
                  <td style={{ padding: '14px 12px' }} className="mono-num">{Number(r.fuelLiters).toLocaleString()} L</td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', fontWeight: 800, color: '#10b981' }} className="mono-num">
                    {r.co2Tonnes} Tonnes
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
