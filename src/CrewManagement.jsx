import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, PlusCircle, Trash2, Edit, Search, Filter, 
  ShieldCheck, Plane, CheckCircle, AlertCircle, RefreshCw, UserPlus, X, Award, Phone, Mail
} from 'lucide-react';
import { api } from './api';

export default function CrewManagement() {
  const [activeSubTab, setActiveSubTab] = useState('directory'); // 'directory' or 'roster'
  const [crewList, setCrewList] = useState([]);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  // Modal State for Add/Edit Crew Member
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCrew, setEditingCrew] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    role: 'Cabin Crew',
    gender: 'Female',
    phone: '',
    email: '',
    status: 'Active'
  });

  // Flight Roster Assignment State
  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [assignedCrew, setAssignedCrew] = useState([]);
  const [assigningCrewId, setAssigningCrewId] = useState('');
  const [assigningRole, setAssigningRole] = useState('Cabin Crew');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [crewRes, flightsRes] = await Promise.all([
        api.getCrewMembers(),
        api.getAdminFlights()
      ]);
      if (crewRes.success) setCrewList(crewRes.crew);
      if (flightsRes.success) {
        setFlights(flightsRes.flights);
        if (flightsRes.flights.length > 0 && !selectedFlightId) {
          setSelectedFlightId(flightsRes.flights[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching crew data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlightCrew = async (flightId) => {
    if (!flightId) return;
    try {
      const res = await api.getFlightCrew(flightId);
      if (res.success) setAssignedCrew(res.assignedCrew);
    } catch (err) {
      console.error('Error fetching flight crew:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedFlightId) {
      fetchFlightCrew(selectedFlightId);
    }
  }, [selectedFlightId]);

  const handleOpenAddModal = (member = null) => {
    if (member) {
      setEditingCrew(member);
      setFormData({
        employeeId: member.employeeId,
        name: member.name,
        role: member.role,
        gender: member.gender,
        phone: member.phone || '',
        email: member.email || '',
        status: member.status || 'Active'
      });
    } else {
      setEditingCrew(null);
      setFormData({
        employeeId: `CRW-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        role: 'Cabin Crew',
        gender: 'Female',
        phone: '',
        email: '',
        status: 'Active'
      });
    }
    setShowAddModal(true);
  };

  const handleSubmitCrew = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.employeeId) {
      alert('Please fill in Employee ID and Name.');
      return;
    }

    try {
      if (editingCrew) {
        const res = await api.updateCrewMember(editingCrew.id, formData);
        if (res.success) {
          alert(res.message);
          setShowAddModal(false);
          fetchData();
        } else {
          alert(res.message);
        }
      } else {
        const res = await api.addCrewMember(formData);
        if (res.success) {
          alert(res.message);
          setShowAddModal(false);
          fetchData();
        } else {
          alert(res.message);
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCrew = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from crew database?`)) return;
    try {
      const res = await api.deleteCrewMember(id);
      if (res.success) {
        alert(res.message);
        fetchData();
        if (selectedFlightId) fetchFlightCrew(selectedFlightId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignCrew = async () => {
    if (!selectedFlightId || !assigningCrewId) {
      alert('Please select a flight and a crew member to assign.');
      return;
    }

    try {
      const res = await api.assignCrewToFlight(selectedFlightId, assigningCrewId, assigningRole);
      if (res.success) {
        alert(res.message);
        fetchFlightCrew(selectedFlightId);
        setAssigningCrewId('');
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUnassignCrew = async (crewId, name) => {
    if (!window.confirm(`Remove ${name} from this flight assignment?`)) return;
    try {
      const res = await api.unassignCrewFromFlight(selectedFlightId, crewId);
      if (res.success) {
        fetchFlightCrew(selectedFlightId);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtered Crew List
  const filteredCrew = crewList.filter(c => {
    const matchesSearch = !searchTerm || (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesRole = !roleFilter || c.role === roleFilter;
    const matchesGender = !genderFilter || c.gender === genderFilter;
    return matchesSearch && matchesRole && matchesGender;
  });

  const selectedFlightObj = flights.find(f => f.id === Number(selectedFlightId) || f.id === selectedFlightId);

  return (
    <div style={{ padding: '4px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users color="#38bdf8" size={24} /> Crew Staff & Flight Roster Management
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Manage Pilots, Female Cabin Crew, and assign qualified flight staff to scheduled departure routes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchData}
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
            <RefreshCw size={14} /> Refresh Roster
          </button>
          <button
            onClick={() => handleOpenAddModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <UserPlus size={15} /> Add Crew Staff
          </button>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveSubTab('directory')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'directory' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeSubTab === 'directory' ? '#38bdf8' : '#94a3b8',
            fontWeight: activeSubTab === 'directory' ? 700 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'directory' ? '2px solid #38bdf8' : 'none'
          }}
        >
          Crew Directory ({crewList.length})
        </button>

        <button
          onClick={() => setActiveSubTab('roster')}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: 'none',
            background: activeSubTab === 'roster' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            color: activeSubTab === 'roster' ? '#10b981' : '#94a3b8',
            fontWeight: activeSubTab === 'roster' ? 700 : 500,
            fontSize: '13px',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'roster' ? '2px solid #10b981' : 'none'
          }}
        >
          Flight Roster Assignment Matrix
        </button>
      </div>

      {/* VIEW 1: CREW DIRECTORY */}
      {activeSubTab === 'directory' && (
        <div>
          {/* Filters Bar */}
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Search by Employee ID, Name, or Role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: '12px', top: '11px' }} />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="" style={{ background: '#0f172a' }}>All Staff Roles</option>
              <option value="Captain" style={{ background: '#0f172a' }}>Captain / Pilot</option>
              <option value="First Officer" style={{ background: '#0f172a' }}>First Officer / Co-Pilot</option>
              <option value="Cabin Crew Lead" style={{ background: '#0f172a' }}>Cabin Crew Lead (Female)</option>
              <option value="Cabin Crew" style={{ background: '#0f172a' }}>Cabin Crew Member (Female)</option>
            </select>

            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '12px',
                outline: 'none'
              }}
            >
              <option value="" style={{ background: '#0f172a' }}>All Genders</option>
              <option value="Female" style={{ background: '#0f172a' }}>Female Crew</option>
              <option value="Male" style={{ background: '#0f172a' }}>Male Crew</option>
            </select>
          </div>

          {/* Directory Table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading crew directory...</div>
            ) : filteredCrew.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>No crew members found matching your search.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '12px' }}>EMP ID</th>
                      <th style={{ padding: '12px' }}>STAFF NAME</th>
                      <th style={{ padding: '12px' }}>ROLE</th>
                      <th style={{ padding: '12px' }}>GENDER</th>
                      <th style={{ padding: '12px' }}>CONTACT</th>
                      <th style={{ padding: '12px' }}>STATUS</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCrew.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '14px 12px', fontWeight: 800, color: '#38bdf8' }} className="mono-num">
                          {c.employeeId}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{c.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{c.email || 'No email registered'}</div>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: c.role.includes('Captain') ? 'rgba(56, 189, 248, 0.15)' :
                                        c.role.includes('Lead') ? 'rgba(236, 72, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: c.role.includes('Captain') ? '#38bdf8' :
                                   c.role.includes('Lead') ? '#ec4899' : '#10b981'
                          }}>
                            {c.role}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: c.gender === 'Female' ? '#ec4899' : '#38bdf8'
                          }}>
                            {c.gender === 'Female' ? '👩 Female Crew' : '👨 Male Crew'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', fontSize: '12px', color: '#94a3b8' }}>
                          {c.phone || '-'}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981'
                          }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenAddModal(c)}
                              style={{ padding: '6px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '6px', color: '#38bdf8', cursor: 'pointer' }}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCrew(c.id, c.name)}
                              style={{ padding: '6px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '6px', color: '#f43f5e', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: FLIGHT ROSTER ASSIGNMENT MATRIX */}
      {activeSubTab === 'roster' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
          {/* Flight Selector */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '14px' }}>
              Select Departure Flight
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
              {flights.map(f => {
                const isSelected = String(f.id) === String(selectedFlightId);
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFlightId(f.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: isSelected ? '#38bdf8' : '#f8fafc' }}>{f.flightNumber}</span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                        {f.aircraft}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
                      {f.source} → {f.destination}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {f.departureDate} at {f.departureTime}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assigned Roster Details */}
          <div>
            {selectedFlightObj ? (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>Active Roster Assignment</span>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                      Flight {selectedFlightObj.flightNumber} ({selectedFlightObj.source} → {selectedFlightObj.destination})
                    </h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      Schedule: {selectedFlightObj.departureDate} at {selectedFlightObj.departureTime} • Aircraft: {selectedFlightObj.aircraft}
                    </p>
                  </div>
                </div>

                {/* Quick Assign Form */}
                <div style={{ padding: '16px', background: 'rgba(56, 189, 248, 0.06)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
                    Assign Staff to Flight {selectedFlightObj.flightNumber}
                  </h4>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <select
                      value={assigningCrewId}
                      onChange={(e) => setAssigningCrewId(e.target.value)}
                      style={{
                        flex: 1,
                        minWidth: '200px',
                        padding: '8px 12px',
                        background: '#0f172a',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    >
                      <option value="">-- Select Pilot / Cabin Crew --</option>
                      {crewList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.role} • {c.gender})
                        </option>
                      ))}
                    </select>

                    <select
                      value={assigningRole}
                      onChange={(e) => setAssigningRole(e.target.value)}
                      style={{
                        width: '180px',
                        padding: '8px 12px',
                        background: '#0f172a',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        outline: 'none'
                      }}
                    >
                      <option value="Captain">Captain / Pilot</option>
                      <option value="First Officer">First Officer</option>
                      <option value="Cabin Crew Lead">Cabin Crew Lead</option>
                      <option value="Cabin Crew">Cabin Crew Member</option>
                    </select>

                    <button
                      onClick={handleAssignCrew}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '6px',
                        background: '#38bdf8',
                        color: '#070b14',
                        fontWeight: 700,
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Assign to Flight
                    </button>
                  </div>
                </div>

                {/* Roster Staff List */}
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
                  Assigned Crew Manifest ({assignedCrew.length} Members)
                </h4>

                {assignedCrew.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', border: '1px dashed var(--border-subtle)', borderRadius: '8px' }}>
                    No crew members assigned to this flight yet. Use the dropdown above to assign pilots and cabin crew.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                    {assignedCrew.map(c => (
                      <div
                        key={c.crewId}
                        style={{
                          padding: '14px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}
                      >
                        <div>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: c.assignedRole?.includes('Captain') ? 'rgba(56, 189, 248, 0.2)' : 'rgba(236, 72, 153, 0.2)',
                            color: c.assignedRole?.includes('Captain') ? '#38bdf8' : '#ec4899'
                          }}>
                            {c.assignedRole || c.role}
                          </span>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', marginTop: '6px' }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            ID: {c.employeeId} • {c.gender === 'Female' ? '👩 Female Crew' : '👨 Male Crew'}
                          </div>
                          {c.phone && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                              📞 {c.phone}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleUnassignCrew(c.crewId, c.name)}
                          title="Remove from flight roster"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f43f5e',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                Select a flight from the left list to manage its crew roster.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT CREW MODAL */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '28px', background: '#0a1122' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                {editingCrew ? 'Edit Crew Member' : 'Register New Crew Staff'}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitCrew} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Employee ID *</label>
                <input
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="e.g. PLT-105 or CRW-402"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Capt. Rajesh Sharma or Sneha Kulkarni"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#0f172a',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  >
                    <option value="Captain">Captain / Pilot</option>
                    <option value="First Officer">First Officer / Co-Pilot</option>
                    <option value="Cabin Crew Lead">Cabin Crew Lead</option>
                    <option value="Cabin Crew">Cabin Crew Member</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#0f172a',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  >
                    <option value="Female">Female Crew</option>
                    <option value="Male">Male Crew</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98220 00000"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="crew@jalgaon.aero"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: '#94a3b8',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {editingCrew ? 'Save Changes' : 'Register Crew'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
