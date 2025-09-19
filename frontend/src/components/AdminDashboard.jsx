import React, { useState, useEffect } from 'react';
import '../styles/AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    statistics: {},
    recentRequests: [],
    todayBookings: [],
    myHalls: []
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [myHalls, setMyHalls] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showHallForm, setShowHallForm] = useState(false);
  
  // NEW STATES FOR EDIT & VIEW FUNCTIONALITY
  const [showEditHallModal, setShowEditHallModal] = useState(false);
  const [showViewBookingsModal, setShowViewBookingsModal] = useState(false);
  const [selectedHall, setSelectedHall] = useState(null);
  const [hallBookings, setHallBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const [approvalForm, setApprovalForm] = useState({
    action: '',
    rejectionReason: '',
    adminNotes: ''
  });

  const [hallForm, setHallForm] = useState({
    name: '',
    number: '',
    location: '',
    capacity: '',
    features: ['AC'],
    amenities: {
      projector: false,
      microphone: false,
      speakers: false,
      wifi: false,
      whiteboard: false,
      ac: false
    },
    pricePerHour: 0,
    operatingHours: {
      start: '07:00',
      end: '18:00'
    }
  });

  // NEW STATE FOR EDIT HALL FORM
  const [editHallForm, setEditHallForm] = useState({
    name: '',
    number: '',
    location: '',
    capacity: '',
    features: [],
    amenities: {
      projector: false,
      microphone: false,
      speakers: false,
      wifi: false,
      whiteboard: false,
      ac: false
    },
    pricePerHour: 0,
    operatingHours: {
      start: '07:00',
      end: '18:00'
    }
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadDashboard(),
        loadPendingRequests(),
        loadMyHalls()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadPendingRequests = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/admin/pending-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPendingRequests(data.data);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadMyHalls = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/admin/my-halls', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMyHalls(data.data);
      }
    } catch (error) {
      console.error('Error loading halls:', error);
    }
  };

  // NEW FUNCTION: Edit Hall
  const handleEditHall = (hall) => {
    console.log('Editing hall:', hall);
    setSelectedHall(hall);
    
    // Populate edit form with existing hall data
    setEditHallForm({
      name: hall.name || '',
      number: hall.number || '',
      location: hall.location || '',
      capacity: hall.capacity || '',
      features: hall.features || ['AC'],
      amenities: {
        projector: hall.amenities?.projector || false,
        microphone: hall.amenities?.microphone || false,
        speakers: hall.amenities?.speakers || false,
        wifi: hall.amenities?.wifi || false,
        whiteboard: hall.amenities?.whiteboard || false,
        ac: hall.amenities?.ac || false
      },
      pricePerHour: hall.pricePerHour || 0,
      operatingHours: {
        start: hall.operatingHours?.start || '07:00',
        end: hall.operatingHours?.end || '18:00'
      }
    });
    
    setShowEditHallModal(true);
  };

  // NEW FUNCTION: Submit Edit Hall
  const handleEditHallSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:5000/api/admin/halls/${selectedHall._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editHallForm)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Hall updated successfully!');
        setShowEditHallModal(false);
        setSelectedHall(null);
        await loadMyHalls(); // Refresh halls list
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Hall update error:', error);
      alert('Error updating hall');
    }
  };

  // NEW FUNCTION: View Hall Bookings
  const handleViewBookings = async (hall) => {
    console.log('Viewing bookings for hall:', hall);
    setSelectedHall(hall);
    setShowViewBookingsModal(true);
    setBookingsLoading(true);
    
    const token = localStorage.getItem('token');
    try {
      // Fetch all requests for this specific hall
      const response = await fetch(`http://localhost:5000/api/admin/my-hall-requests?hallId=${hall._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setHallBookings(data.data || []);
      } else {
        console.error('Error fetching bookings:', data.message);
        setHallBookings([]);
      }
    } catch (error) {
      console.error('Error loading hall bookings:', error);
      setHallBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleApproveReject = (request, action) => {
    setSelectedRequest(request);
    setApprovalForm({
      action,
      rejectionReason: '',
      adminNotes: ''
    });
    setShowApprovalModal(true);
  };

  const handleApprovalSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:5000/api/admin/booking-request/${selectedRequest._id}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(approvalForm)
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Request ${approvalForm.action}d successfully!`);
        setShowApprovalModal(false);
        await loadDashboardData(); // Refresh data
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Approval error:', error);
      alert('Error processing request');
    }
  };

  const handleCreateHall = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:5000/api/admin/halls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(hallForm)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Hall created successfully!');
        setShowHallForm(false);
        setHallForm({
          name: '',
          number: '',
          location: '',
          capacity: '',
          features: ['AC'],
          amenities: {
            projector: false,
            microphone: false,
            speakers: false,
            wifi: false,
            whiteboard: false,
            ac: false
          },
          pricePerHour: 0,
          operatingHours: {
            start: '07:00',
            end: '18:00'
          }
        });
        await loadMyHalls(); // Refresh halls
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Hall creation error:', error);
      alert('Error creating hall');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour12 = ((parseInt(hours) + 11) % 12 + 1);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#ff9800',
      'APPROVED': '#4caf50',
      'REJECTED': '#f44336'
    };
    return colors[status] || '#9e9e9e';
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <img 
            src="https://event-space-ncas.web.app/src/img/logo.png" 
            alt="Event Space" 
            className="sidebar-logo"
          />
          <div className="admin-info">
            <h3>Hall Admin</h3>
            <p>{user?.name}</p>
            <span className="department">{user?.department}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <span className="nav-icon">⏳</span>
            <span>Pending Requests</span>
            {pendingRequests.length > 0 && (
              <span className="badge">{pendingRequests.length}</span>
            )}
          </div>
          <div 
            className={`nav-item ${activeTab === 'halls' ? 'active' : ''}`}
            onClick={() => setActiveTab('halls')}
          >
            <span className="nav-icon">🏢</span>
            <span>My Halls</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <span className="nav-icon">➕</span>
            <span>Create Hall</span>
          </div>
          <div className="nav-item logout" onClick={onLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        {/* Header */}
        <div className="content-header">
          <h1>
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'pending' && 'Pending Requests'}
            {activeTab === 'halls' && 'My Halls'}
            {activeTab === 'create' && 'Create New Hall'}
          </h1>
          <div className="user-profile">
            <span>Welcome, {user?.name}</span>
            <div className="profile-avatar">👨‍💼</div>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏢</div>
                <div className="stat-info">
                  <h3>{dashboardData.statistics.totalHalls || 0}</h3>
                  <p>My Halls</p>
                </div>
              </div>
              <div className="stat-card pending">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>{dashboardData.statistics.pendingRequests || 0}</h3>
                  <p>Pending Requests</p>
                </div>
              </div>
              <div className="stat-card approved">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{dashboardData.statistics.approvedBookings || 0}</h3>
                  <p>Approved Bookings</p>
                </div>
              </div>
              <div className="stat-card rejected">
                <div className="stat-icon">❌</div>
                <div className="stat-info">
                  <h3>{dashboardData.statistics.rejectedRequests || 0}</h3>
                  <p>Rejected Requests</p>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="section">
              <h3>Recent Requests</h3>
              <div className="requests-table">
                {dashboardData.recentRequests.length === 0 ? (
                  <p className="no-data">No recent requests</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Programme</th>
                        <th>Hall</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Requested By</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentRequests.slice(0, 5).map(request => (
                        <tr key={request._id}>
                          <td>{request.programmeName}</td>
                          <td>{request.hall.name}</td>
                          <td>{formatDate(request.eventDate)}</td>
                          <td>{formatTime(request.startTime)} - {formatTime(request.endTime)}</td>
                          <td>{request.requestedBy.name}</td>
                          <td>
                            <span 
                              className="status-badge"
                              style={{ backgroundColor: getStatusColor(request.status) }}
                            >
                              {request.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Today's Bookings */}
            <div className="section">
              <h3>Today's Approved Bookings</h3>
              <div className="today-bookings">
                {dashboardData.todayBookings.length === 0 ? (
                  <p className="no-data">No bookings for today</p>
                ) : (
                  <div className="booking-cards">
                    {dashboardData.todayBookings.map(booking => (
                      <div key={booking._id} className="booking-card">
                        <h4>{booking.hall.name}</h4>
                        <p><strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                        <p><strong>Organizer:</strong> {booking.requestedBy.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === 'pending' && (
          <div className="pending-requests">
            {pendingRequests.length === 0 ? (
              <div className="no-requests">
                <h3>🎉 All caught up!</h3>
                <p>No pending requests at the moment.</p>
              </div>
            ) : (
              <div className="requests-grid">
                {pendingRequests.map(request => (
                  <div key={request._id} className="request-card">
                    <div className="request-header">
                      <h4>{request.programmeName}</h4>
                      <span className="urgent-badge">PENDING APPROVAL</span>
                    </div>

                    <div className="request-details">
                      <div className="detail-row">
                        <span><strong>Hall:</strong> {request.hall.name} (#{request.hall.number})</span>
                        <span><strong>Date:</strong> {formatDate(request.eventDate)}</span>
                      </div>
                      <div className="detail-row">
                        <span><strong>Time:</strong> {formatTime(request.startTime)} - {formatTime(request.endTime)}</span>
                        <span><strong>Seats:</strong> {request.numberOfSeats}</span>
                      </div>
                      <div className="detail-row">
                        <span><strong>Requested by:</strong> {request.requestedBy.name}</span>
                        <span><strong>Email:</strong> {request.requestedBy.email}</span>
                      </div>
                      <div className="detail-row">
                        <span><strong>Department:</strong> {request.requestedBy.department}</span>
                        <span><strong>Requested on:</strong> {formatDate(request.createdAt)}</span>
                      </div>

                      {request.extraRequirements && (
                        <div className="extra-requirements">
                          <strong>Extra Requirements:</strong>
                          <p>{request.extraRequirements}</p>
                        </div>
                      )}

                      <div className="equipment-requirements">
                        <strong>Equipment:</strong>
                        {request.equipmentRequirements?.ac && <span className="equipment-tag">❄️ AC</span>}
                        {request.equipmentRequirements?.projector && <span className="equipment-tag">📽️ Projector</span>}
                        {!request.equipmentRequirements?.ac && !request.equipmentRequirements?.projector && (
                          <span>None required</span>
                        )}
                      </div>
                    </div>

                    <div className="request-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveReject(request, 'approve')}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleApproveReject(request, 'reject')}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Halls Tab - UPDATED WITH WORKING BUTTONS */}
        {activeTab === 'halls' && (
          <div className="my-halls">
            <div className="section-header">
              <h3>My Halls ({myHalls.length})</h3>
              
            </div>

            <div className="halls-grid">
              {myHalls.map(hall => (
                <div key={hall._id} className="hall-card">
                  <div className="hall-header">
                    <h4>{hall.name}</h4>
                    <span className="hall-number">#{hall.number}</span>
                  </div>

                  <div className="hall-details">
                    <p><strong>Location:</strong> {hall.location}</p>
                    <p><strong>Capacity:</strong> {hall.capacity} seats</p>
                    <p><strong>Features:</strong> {hall.features.join(', ')}</p>
                    <p><strong>Operating Hours:</strong> {hall.operatingHours?.start} - {hall.operatingHours?.end}</p>
                    
                    <div className="amenities">
                      <strong>Amenities:</strong>
                      <div className="amenity-tags">
                        {hall.amenities.projector && <span className="amenity">📽️</span>}
                        {hall.amenities.microphone && <span className="amenity">🎤</span>}
                        {hall.amenities.speakers && <span className="amenity">🔊</span>}
                        {hall.amenities.wifi && <span className="amenity">📶</span>}
                        {hall.amenities.whiteboard && <span className="amenity">📝</span>}
                        {hall.amenities.ac && <span className="amenity">❄️</span>}
                      </div>
                    </div>
                  </div>

                  {/* UPDATED HALL ACTIONS - NOW WORKING */}
                  <div className="hall-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditHall(hall)}
                      title="Edit Hall Details"
                    >
                      ✏️ Edit
                    </button>
                   
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Hall Tab */}
        {activeTab === 'create' && (
          <div className="create-hall">
            <div className="form-container">
              <h3>Create New Hall</h3>
              <form onSubmit={handleCreateHall} className="hall-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Hall Name *</label>
                    <input
                      type="text"
                      required
                      value={hallForm.name}
                      onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })}
                      placeholder="Enter hall name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Hall Number *</label>
                    <input
                      type="text"
                      required
                      value={hallForm.number}
                      onChange={(e) => setHallForm({ ...hallForm, number: e.target.value })}
                      placeholder="e.g., 001"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    required
                    value={hallForm.location}
                    onChange={(e) => setHallForm({ ...hallForm, location: e.target.value })}
                    placeholder="Building, Floor, Block details"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Capacity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={hallForm.capacity}
                      onChange={(e) => setHallForm({ ...hallForm, capacity: parseInt(e.target.value) })}
                      placeholder="Number of seats"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Price per Hour</label>
                    <input
                      type="number"
                      min="0"
                      value={hallForm.pricePerHour}
                      onChange={(e) => setHallForm({ ...hallForm, pricePerHour: parseInt(e.target.value) })}
                      placeholder="₹0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Features</label>
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={hallForm.features.includes('AC')}
                        onChange={(e) => {
                          const features = e.target.checked 
                            ? [...hallForm.features, 'AC']
                            : hallForm.features.filter(f => f !== 'AC');
                          setHallForm({ ...hallForm, features });
                        }}
                      />
                      AC Available
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={hallForm.features.includes('Premium')}
                        onChange={(e) => {
                          const features = e.target.checked 
                            ? [...hallForm.features, 'Premium']
                            : hallForm.features.filter(f => f !== 'Premium');
                          setHallForm({ ...hallForm, features });
                        }}
                      />
                      Premium Hall
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Amenities</label>
                  <div className="amenities-grid">
                    {Object.entries(hallForm.amenities).map(([key, value]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setHallForm({
                            ...hallForm,
                            amenities: {
                              ...hallForm.amenities,
                              [key]: e.target.checked
                            }
                          })}
                        />
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Opening Time</label>
                    <input
                      type="time"
                      value={hallForm.operatingHours.start}
                      onChange={(e) => setHallForm({
                        ...hallForm,
                        operatingHours: {
                          ...hallForm.operatingHours,
                          start: e.target.value
                        }
                      })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Closing Time</label>
                    <input
                      type="time"
                      value={hallForm.operatingHours.end}
                      onChange={(e) => setHallForm({
                        ...hallForm,
                        operatingHours: {
                          ...hallForm.operatingHours,
                          end: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>

                <button type="submit" className="submit-btn">
                  Create Hall
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="modal-overlay">
          <div className="approval-modal">
            <div className="modal-header">
              <h3>{approvalForm.action === 'approve' ? 'Approve Request' : 'Reject Request'}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowApprovalModal(false)}
              >
                ×
              </button>
            </div>

            <div className="request-summary">
              <h4>{selectedRequest?.programmeName}</h4>
              <p><strong>Hall:</strong> {selectedRequest?.hall.name}</p>
              <p><strong>Date:</strong> {formatDate(selectedRequest?.eventDate)}</p>
              <p><strong>Time:</strong> {formatTime(selectedRequest?.startTime)} - {formatTime(selectedRequest?.endTime)}</p>
              <p><strong>Requested by:</strong> {selectedRequest?.requestedBy.name}</p>
            </div>

            <form onSubmit={handleApprovalSubmit} className="approval-form">
              {approvalForm.action === 'reject' && (
                <div className="form-group">
                  <label>Rejection Reason *</label>
                  <textarea
                    required
                    value={approvalForm.rejectionReason}
                    onChange={(e) => setApprovalForm({ ...approvalForm, rejectionReason: e.target.value })}
                    placeholder="Please provide a reason for rejection..."
                    rows="3"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Admin Notes (Optional)</label>
                <textarea
                  value={approvalForm.adminNotes}
                  onChange={(e) => setApprovalForm({ ...approvalForm, adminNotes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows="2"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowApprovalModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`submit-btn ${approvalForm.action === 'approve' ? 'approve' : 'reject'}`}
                >
                  {approvalForm.action === 'approve' ? '✅ Approve' : '❌ Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW MODAL: Edit Hall - FIXED UI */}
      {showEditHallModal && selectedHall && (
        <div className="modal-overlay">
          <div className="edit-hall-modal">
            <div className="modal-header">
              <h3>✏️ Edit Hall - {selectedHall.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowEditHallModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditHallSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <span className="label-text">Hall Name</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editHallForm.name}
                    onChange={(e) => setEditHallForm({ ...editHallForm, name: e.target.value })}
                    placeholder="Enter hall name"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>
                    <span className="label-text">Hall Number</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editHallForm.number}
                    onChange={(e) => setEditHallForm({ ...editHallForm, number: e.target.value })}
                    placeholder="e.g., 001"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <span className="label-text">Location</span>
                  <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editHallForm.location}
                  onChange={(e) => setEditHallForm({ ...editHallForm, location: e.target.value })}
                  placeholder="Building, Floor, Block details"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <span className="label-text">Capacity</span>
                    <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editHallForm.capacity}
                    onChange={(e) => setEditHallForm({ ...editHallForm, capacity: parseInt(e.target.value) })}
                    placeholder="Number of seats"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>
                    <span className="label-text">Price per Hour</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editHallForm.pricePerHour}
                    onChange={(e) => setEditHallForm({ ...editHallForm, pricePerHour: parseInt(e.target.value) })}
                    placeholder="₹0"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <span className="label-text">Features</span>
                </label>
                <div className="checkbox-group-styled">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={editHallForm.features.includes('AC')}
                      onChange={(e) => {
                        const features = e.target.checked 
                          ? [...editHallForm.features, 'AC']
                          : editHallForm.features.filter(f => f !== 'AC');
                        setEditHallForm({ ...editHallForm, features });
                      }}
                    />
                    <span className="checkmark"></span>
                    <span>AC Available</span>
                  </label>
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={editHallForm.features.includes('Premium')}
                      onChange={(e) => {
                        const features = e.target.checked 
                          ? [...editHallForm.features, 'Premium']
                          : editHallForm.features.filter(f => f !== 'Premium');
                        setEditHallForm({ ...editHallForm, features });
                      }}
                    />
                    <span className="checkmark"></span>
                    <span>Premium Hall</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <span className="label-text">Amenities</span>
                </label>
                <div className="amenities-grid-styled">
                  {Object.entries(editHallForm.amenities).map(([key, value]) => (
                    <label key={key} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setEditHallForm({
                          ...editHallForm,
                          amenities: {
                            ...editHallForm.amenities,
                            [key]: e.target.checked
                          }
                        })}
                      />
                      <span className="checkmark"></span>
                      <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <span className="label-text">Opening Time</span>
                  </label>
                  <input
                    type="time"
                    value={editHallForm.operatingHours.start}
                    onChange={(e) => setEditHallForm({
                      ...editHallForm,
                      operatingHours: {
                        ...editHallForm.operatingHours,
                        start: e.target.value
                      }
                    })}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>
                    <span className="label-text">Closing Time</span>
                  </label>
                  <input
                    type="time"
                    value={editHallForm.operatingHours.end}
                    onChange={(e) => setEditHallForm({
                      ...editHallForm,
                      operatingHours: {
                        ...editHallForm.operatingHours,
                        end: e.target.value
                      }
                    })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowEditHallModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  💾 Update Hall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW MODAL: View Bookings - FIXED CONTENT */}
      {showViewBookingsModal && selectedHall && (
        <div className="modal-overlay">
          <div className="view-bookings-modal">
            <div className="modal-header">
              <h3>👁️ Bookings - {selectedHall.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowViewBookingsModal(false)}
              >
                ×
              </button>
            </div>

            <div className="bookings-content">
              {bookingsLoading ? (
                <div className="loading" style={{ padding: '4rem' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading bookings...</p>
                </div>
              ) : (
                <>
                  <div className="bookings-summary">
                    <div className="summary-card">
                      <h4>📊 Booking Summary</h4>
                      <div className="summary-stats">
                        <p><strong>Total Requests:</strong> {hallBookings.length}</p>
                        <p><strong>⏳ Pending:</strong> {hallBookings.filter(b => b.status === 'PENDING').length}</p>
                        <p><strong>✅ Approved:</strong> {hallBookings.filter(b => b.status === 'APPROVED').length}</p>
                        <p><strong>❌ Rejected:</strong> {hallBookings.filter(b => b.status === 'REJECTED').length}</p>
                      </div>
                      <div className="hall-info" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                        <p><strong>📍 Hall:</strong> {selectedHall.name} (#{selectedHall.number})</p>
                        <p><strong>📍 Location:</strong> {selectedHall.location}</p>
                        <p><strong>👥 Capacity:</strong> {selectedHall.capacity} seats</p>
                      </div>
                    </div>
                  </div>

                  <div className="bookings-list">
                    {hallBookings.length === 0 ? (
                      <div className="no-bookings">
                        <h4>🎉 No bookings yet!</h4>
                        <p>This hall hasn't received any booking requests yet.</p>
                      </div>
                    ) : (
                      <div className="bookings-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Programme Details</th>
                              <th>Date & Time</th>
                              <th>Requested By</th>
                              <th>Seats</th>
                              <th>Status</th>
                              <th>Requested On</th>
                            </tr>
                          </thead>
                          <tbody>
                            {hallBookings.map(booking => (
                              <tr key={booking._id}>
                                <td>
                                  <div className="programme-info">
                                    <strong>{booking.programmeName}</strong>
                                    {booking.extraRequirements && (
                                      <div className="extra-req-hint" title={booking.extraRequirements}>
                                        📝 Special requirements
                                      </div>
                                    )}
                                    {(booking.equipmentRequirements?.ac || booking.equipmentRequirements?.projector) && (
                                      <div className="equipment-needed">
                                        {booking.equipmentRequirements?.ac && <span>❄️ AC</span>}
                                        {booking.equipmentRequirements?.projector && <span>📽️ Projector</span>}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <div className="datetime-info">
                                    <div><strong>{formatDate(booking.eventDate)}</strong></div>
                                    <div className="time-slot">
                                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <div className="requester-info">
                                    <strong>{booking.requestedBy?.name || 'Unknown'}</strong>
                                    <div className="requester-email">{booking.requestedBy?.email || 'No email'}</div>
                                    <div className="requester-dept">{booking.requestedBy?.department || 'No department'}</div>
                                  </div>
                                </td>
                                <td>
                                  <strong>{booking.numberOfSeats}</strong>
                                  {booking.guestsAttending && (
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                      👥 Guests expected
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <span 
                                    className="status-badge"
                                    style={{ backgroundColor: getStatusColor(booking.status) }}
                                  >
                                    {booking.status}
                                  </span>
                                  {booking.status === 'REJECTED' && booking.rejectionReason && (
                                    <div className="rejection-hint" title={booking.rejectionReason}>
                                      💬 View reason
                                    </div>
                                  )}
                                  {booking.adminNotes && (
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#6b7280' }}>
                                      📝 Has admin notes
                                    </div>
                                  )}
                                </td>
                                <td>{formatDate(booking.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowViewBookingsModal(false)}
              >
                Close
              </button>
              <button 
                className="primary-btn"
                onClick={() => {
                  // Refresh bookings
                  handleViewBookings(selectedHall);
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hall Creation Modal */}
      {showHallForm && (
        <div className="modal-overlay">
          <div className="hall-modal">
            <div className="modal-header">
              <h3>Create New Hall</h3>
              <button 
                className="close-btn"
                onClick={() => setShowHallForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateHall} className="modal-form">
              {/* Same form fields as in create tab */}
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowHallForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Hall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
