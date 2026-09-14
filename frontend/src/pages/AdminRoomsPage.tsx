import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { AdminLayout } from '../components/AdminLayout';
import { DoorOpen, Plus, Edit2, Trash2, CheckCircle, AlertCircle, Loader2, X, UserCheck } from 'lucide-react';
import { AdminPagination } from '../components/AdminPagination';

interface Room {
  id: number;
  event_type: 'event' | 'hackathon';
  event_name: string;
  room_name: string;
  room_code: string;
  capacity?: number;
  assigned_desk_id?: string;
  assigned_desk_name?: string;
  created_at?: string;
}

interface DeskMember {
  id: number;
  desk_id: string;
  name: string;
  status: string;
}

interface EventOption {
  title: string;
  date?: string;
}

export const AdminRoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [deskMembers, setDeskMembers] = useState<DeskMember[]>([]);
  const [eventsList, setEventsList] = useState<EventOption[]>([]);
  const [hackathonsList, setHackathonsList] = useState<EventOption[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Create Room Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formEventType, setFormEventType] = useState<'hackathon' | 'event'>('hackathon');
  const [formEventName, setFormEventName] = useState('');
  const [formRoomName, setFormRoomName] = useState('');
  const [formRoomCode, setFormRoomCode] = useState('');
  const [formCapacity, setFormCapacity] = useState<number | string>('');
  const [formAssignedDeskId, setFormAssignedDeskId] = useState('');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit Room Modal State
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Confirm Modal State
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      // 1. Fetch Rooms
      const roomsRes = await fetch(`${API_BASE_URL}/api/admin/rooms`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!roomsRes.ok) throw new Error('Failed to load rooms.');
      const roomsData = await roomsRes.json();
      setRooms(roomsData);

      // 2. Fetch Desk Members
      const membersRes = await fetch(`${API_BASE_URL}/api/admin/reg-desk-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setDeskMembers(membersData);
      }

      // 3. Fetch Events & Hackathons
      const eventsRes = await fetch(`${API_BASE_URL}/api/events`);
      if (eventsRes.ok) {
        const evts = await eventsRes.json();
        const nonHacks = evts.filter((e: any) => e.category !== 'Hackathon');
        const hacks = evts.filter((e: any) => e.category === 'Hackathon');
        setEventsList(nonHacks);
        setHackathonsList(hacks);

        if (hacks.length > 0 && !formEventName) {
          setFormEventName(hacks[0].title);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleSync = (e: Event) => {
      const eventType = (e as CustomEvent).detail;
      if (eventType === 'REFRESH_ROOMS' || eventType === 'REFRESH_REG_DESK_USERS') {
        fetchData();
      }
    };
    window.addEventListener('app-sync', handleSync);
    return () => window.removeEventListener('app-sync', handleSync);
  }, []);

  // Handle Create Room
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    setError('');

    const assignedMember = deskMembers.find(m => m.desk_id === formAssignedDeskId);
    const token = localStorage.getItem('admin_token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_type: formEventType,
          event_name: formEventName.trim(),
          room_name: formRoomName.trim(),
          room_code: formRoomCode.trim(),
          capacity: Number(formCapacity) || 0,
          assigned_desk_id: formAssignedDeskId || null,
          assigned_desk_name: assignedMember ? assignedMember.name : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create room.');

      showToast(`Room ${formRoomCode} created successfully.`);
      setIsCreateModalOpen(false);
      setFormRoomName('');
      setFormRoomCode('');
      setFormCapacity('');
      setFormAssignedDeskId('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Edit Room
  const handleEditRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    setIsSubmittingEdit(true);
    setError('');

    const assignedMember = deskMembers.find(m => m.desk_id === formAssignedDeskId);
    const token = localStorage.getItem('admin_token');

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/rooms/${editingRoom.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_type: formEventType,
          event_name: formEventName.trim(),
          room_name: formRoomName.trim(),
          room_code: formRoomCode.trim(),
          capacity: Number(formCapacity) || 0,
          assigned_desk_id: formAssignedDeskId || null,
          assigned_desk_name: assignedMember ? assignedMember.name : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update room.');

      showToast(`Room ${formRoomCode} updated successfully.`);
      setEditingRoom(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Delete Room
  const handleDeleteRoom = async () => {
    if (!deletingRoom) return;
    setIsSubmittingDelete(true);
    setError('');

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/rooms/${deletingRoom.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete room.');
      }

      showToast(`Room ${deletingRoom.room_code} deleted.`);
      setDeletingRoom(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Open Edit Modal
  const startEditRoom = (r: Room) => {
    setEditingRoom(r);
    setFormEventType(r.event_type);
    setFormEventName(r.event_name);
    setFormRoomName(r.room_name);
    setFormRoomCode(r.room_code);
    setFormCapacity(r.capacity || '');
    setFormAssignedDeskId(r.assigned_desk_id || '');
  };

  const totalPages = Math.ceil(rooms.length / PAGE_SIZE);
  const paginatedRooms = rooms.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="admin-content-inner" style={{ padding: '2rem 2.5rem' }}>
        
        {/* Toast Notification */}
        {toast && (
          <div style={{ position: 'fixed', top: '1.5rem', right: '1.5rem', backgroundColor: '#065f46', color: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
            <CheckCircle size={18} /> {toast}
          </div>
        )}

        {/* Page Header */}
        <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Registration Rooms</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
              Create event rooms, manage capacities, and assign Registration Desk coordinators.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingRoom(null);
              setFormRoomName('');
              setFormRoomCode('');
              setFormCapacity('');
              setFormAssignedDeskId('');
              if (hackathonsList.length > 0) setFormEventName(hackathonsList[0].title);
              else if (eventsList.length > 0) setFormEventName(eventsList[0].title);
              setIsCreateModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', fontWeight: 600 }}
          >
            <Plus size={18} />
            <span>Create Room</span>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Rooms Table */}
        <div className="admin-table-container">
          {isLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 className="spinner-icon" size={32} style={{ margin: '0 auto 1rem auto', color: 'var(--primary)' }} />
              <p>Loading event rooms and assignments...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <DoorOpen size={40} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h3>No Rooms Created Yet</h3>
              <p>Click "Create Room" to set up rooms and assign registration staff for your events.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Room Code / Name</th>
                  <th>Event / Hackathon</th>
                  <th>Capacity</th>
                  <th>Assigned Registration Desk</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRooms.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                          backgroundColor: 'rgba(56, 189, 248, 0.1)', 
                          color: 'var(--primary)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', 
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          fontFamily: 'monospace'
                        }}>
                          {r.room_code}
                        </span>
                        <strong style={{ fontSize: '0.95rem' }}>{r.room_name}</strong>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{r.event_name}</strong>
                        <span style={{ 
                          display: 'inline-block',
                          marginLeft: '0.5rem',
                          fontSize: '0.7rem', 
                          color: r.event_type === 'hackathon' ? '#7c3aed' : '#0284c7', 
                          backgroundColor: r.event_type === 'hackathon' ? '#f5f3ff' : '#f0f9ff',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          fontWeight: 700
                        }}>
                          {r.event_type}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {r.capacity && r.capacity > 0 ? `${r.capacity} seats` : 'Open / Uncapped'}
                      </span>
                    </td>
                    <td>
                      {r.assigned_desk_id ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600, fontSize: '0.825rem' }}>
                          <UserCheck size={14} />
                          <span>{r.assigned_desk_name || r.assigned_desk_id}</span>
                          <span style={{ opacity: 0.75, fontSize: '0.75rem', fontFamily: 'monospace' }}>({r.assigned_desk_id})</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontStyle: 'italic' }}>
                          Unassigned (General Desk)
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => startEditRoom(r)}
                          className="btn-action edit"
                          title="Edit Room"
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingRoom(r)}
                          className="btn-action reject"
                          title="Delete Room"
                          style={{ padding: '0.35rem 0.6rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={rooms.length}
            pageSize={PAGE_SIZE}
            onPageChange={(page) => setCurrentPage(page)}
            itemName="rooms"
          />
        </div>

        {/* Create / Edit Room Modal */}
        {(isCreateModalOpen || editingRoom) && (
          <div className="custom-modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="custom-modal card" style={{ maxWidth: '520px', width: '100%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                  {editingRoom ? `Edit Room: ${editingRoom.room_code}` : 'Create New Room'}
                </h3>
                <button 
                  onClick={() => { setIsCreateModalOpen(false); setEditingRoom(null); }} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={editingRoom ? handleEditRoom : handleCreateRoom}>
                
                {/* Event Type selector */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormEventType('hackathon');
                      if (hackathonsList.length > 0) setFormEventName(hackathonsList[0].title);
                    }}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.4rem',
                      border: '1px solid',
                      borderColor: formEventType === 'hackathon' ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: formEventType === 'hackathon' ? 'var(--primary-light)' : 'transparent',
                      color: formEventType === 'hackathon' ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Hackathon
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormEventType('event');
                      if (eventsList.length > 0) setFormEventName(eventsList[0].title);
                    }}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '0.4rem',
                      border: '1px solid',
                      borderColor: formEventType === 'event' ? 'var(--primary)' : 'var(--border)',
                      backgroundColor: formEventType === 'event' ? 'var(--primary-light)' : 'transparent',
                      color: formEventType === 'event' ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Technical Event
                  </button>
                </div>

                {/* Event Dropdown */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Event / Hackathon Name</label>
                  <select
                    required
                    className="form-control"
                    value={formEventName}
                    onChange={(e) => setFormEventName(e.target.value)}
                  >
                    <option value="" disabled>-- Select Event --</option>
                    {(formEventType === 'hackathon' ? hackathonsList : eventsList).map((opt, idx) => (
                      <option key={idx} value={opt.title}>
                        {opt.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Code & Room Name */}
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Room Code / No.</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Room 101"
                      value={formRoomCode}
                      onChange={(e) => setFormRoomCode(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Room Name / Description</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Innovation Hall A"
                      value={formRoomName}
                      onChange={(e) => setFormRoomName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Capacity */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Seating Capacity (Optional)</label>
                  <input
                    type="number"
                    min={0}
                    className="form-control"
                    placeholder="e.g. 60 (leave empty if open)"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                  />
                </div>

                {/* Assigned Desk Member */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Assign Registration Desk Team Member</label>
                  <select
                    className="form-control"
                    value={formAssignedDeskId}
                    onChange={(e) => setFormAssignedDeskId(e.target.value)}
                  >
                    <option value="">-- No Assignment (Open Desk) --</option>
                    {deskMembers.map((m) => (
                      <option key={m.id} value={m.desk_id}>
                        {m.name} ({m.desk_id}) {m.status === 'inactive' ? '[Inactive]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    onClick={() => { setIsCreateModalOpen(false); setEditingRoom(null); }} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmittingCreate || isSubmittingEdit} 
                    className="btn btn-primary"
                  >
                    {isSubmittingCreate ? 'Creating...' : isSubmittingEdit ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deletingRoom && (
          <div className="custom-modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="custom-modal card" style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
              <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.25rem', color: '#dc2626' }}>Delete Room</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Are you sure you want to delete room <strong>{deletingRoom.room_code} - {deletingRoom.room_name}</strong>?
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setDeletingRoom(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="button" disabled={isSubmittingDelete} onClick={handleDeleteRoom} className="btn btn-danger">
                  {isSubmittingDelete ? 'Deleting...' : 'Delete Room'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};
