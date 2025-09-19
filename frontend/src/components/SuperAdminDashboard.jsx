import React, { useState, useEffect } from 'react';
import '../styles/SuperAdminDashboard.css';

const SuperAdminDashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, admins, create, profile
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    phone: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    department: '',
    phone: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/superadmin/admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAdmins(data.data);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (createForm.password !== createForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:5000/api/superadmin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
          department: createForm.department,
          phone: createForm.phone
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Hall admin created successfully!');
        setShowCreateModal(false);
        setCreateForm({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          department: '',
          phone: ''
        });
        await loadAdmins();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Admin creation error:', error);
      alert('Error creating admin');
    }
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:5000/api/superadmin/admins/${selectedAdmin._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Admin updated successfully!');
        setShowEditModal(false);
        setSelectedAdmin(null);
        await loadAdmins();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Admin update error:', error);
      alert('Error updating admin');
    }
  };

  const handleToggleAdminStatus = async (admin, action) => {
    const token = localStorage.getItem('token');
    const endpoint = action === 'deactivate' ? 'deactivate' : 'reactivate';

    try {
      const response = await fetch(`http://localhost:5000/api/superadmin/admins/${admin._id}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Admin ${action}d successfully!`);
        await loadAdmins();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error(`Admin ${action} error:`, error);
      alert(`Error ${action}ing admin`);
    }
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setEditForm({
      name: admin.name,
      email: admin.email,
      department: admin.department || '',
      phone: admin.phone || ''
    });
    setShowEditModal(true);
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (admin.department && admin.department.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && admin.isActive) ||
                         (filterActive === 'inactive' && !admin.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const getStats = () => {
    const totalAdmins = admins.length;
    const activeAdmins = admins.filter(admin => admin.isActive).length;
    const inactiveAdmins = totalAdmins - activeAdmins;
    const departments = [...new Set(admins.map(admin => admin.department).filter(Boolean))].length;

    return { totalAdmins, activeAdmins, inactiveAdmins, departments };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading super admin dashboard...</div>;
  }

  const stats = getStats();

  return (
    <div className="superadmin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <img 
            src="https://event-space-ncas.web.app/src/img/logo.png" 
            alt="Event Space" 
            className="logo"
          />
          <div className="header-info">
            <h1>Super Admin Panel</h1>
            <p>Manage Hall Administrators</p>
          </div>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar">👑</div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">Super Administrator</span>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <span className="logout-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="nav-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveTab('admins')}
        >
          <span className="tab-icon">👨‍💼</span>
          Hall Admins ({stats.totalAdmins})
        </button>
        <button 
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <span className="tab-icon">➕</span>
          Create Admin
        </button>
        <button 
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="tab-icon">⚙️</span>
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>{stats.totalAdmins}</h3>
                  <p>Total Admins</p>
                </div>
              </div>
              <div className="stat-card active">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>{stats.activeAdmins}</h3>
                  <p>Active Admins</p>
                </div>
              </div>
              <div className="stat-card inactive">
                <div className="stat-icon">⏸️</div>
                <div className="stat-info">
                  <h3>{stats.inactiveAdmins}</h3>
                  <p>Inactive Admins</p>
                </div>
              </div>
              <div className="stat-card departments">
                <div className="stat-icon">🏛️</div>
                <div className="stat-info">
                  <h3>{stats.departments}</h3>
                  <p>Departments</p>
                </div>
              </div>
            </div>

            {/* Recent Admins */}
            <div className="section">
              <div className="section-header">
                <h3>Recent Hall Admins</h3>
                <button 
                  className="primary-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  ➕ Add New Admin
                </button>
              </div>
              
              <div className="recent-admins">
                {admins.slice(0, 5).map(admin => (
                  <div key={admin._id} className="admin-row">
                    <div className="admin-avatar">👨‍💼</div>
                    <div className="admin-info">
                      <h4>{admin.name}</h4>
                      <p>{admin.email}</p>
                      <span className="department">{admin.department}</span>
                    </div>
                    <div className="admin-status">
                      <span 
                        className={`status-badge ${admin.isActive ? 'active' : 'inactive'}`}
                      >
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="join-date">
                        Joined {formatDate(admin.createdAt)}
                      </span>
                    </div>
                    <div className="admin-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => openEditModal(admin)}
                      >
                        ✏️
                      </button>
                      <button 
                        className={`toggle-btn ${admin.isActive ? 'deactivate' : 'activate'}`}
                        onClick={() => handleToggleAdminStatus(admin, admin.isActive ? 'deactivate' : 'reactivate')}
                      >
                        {admin.isActive ? '⏸️' : '▶️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Info */}
            <div className="section">
              <h3>System Information</h3>
              <div className="system-info">
                <div className="info-card">
                  <h4>Hall Management System</h4>
                  <p><strong>Version:</strong> 2.0.0</p>
                  <p><strong>Last Update:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>Status:</strong> <span className="system-status online">Online</span></p>
                </div>
                <div className="info-card">
                  <h4>User Management</h4>
                  <p><strong>Total Users:</strong> {stats.totalAdmins + 1} (including super admin)</p>
                  <p><strong>Active Sessions:</strong> {stats.activeAdmins}</p>
                  <p><strong>Security:</strong> <span className="security-status secure">Secure</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admins Management Tab */}
        {activeTab === 'admins' && (
          <div className="admins-management">
            {/* Search and Filter */}
            <div className="search-section">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search admins by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-controls">
                <select 
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Admins</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                <button 
                  className="create-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  ➕ Create New Admin
                </button>
              </div>
            </div>

            {/* Admins Table */}
            <div className="admins-table">
              {filteredAdmins.length === 0 ? (
                <div className="no-admins">
                  <h3>No admins found</h3>
                  <p>
                    {searchQuery ? 
                      'Try adjusting your search criteria' : 
                      'Start by creating your first hall administrator'
                    }
                  </p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Admin Details</th>
                      <th>Department</th>
                      <th>Contact</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdmins.map(admin => (
                      <tr key={admin._id} className={!admin.isActive ? 'inactive-row' : ''}>
                        <td>
                          <div className="admin-cell">
                            <div className="admin-avatar">👨‍💼</div>
                            <div className="admin-details">
                              <strong>{admin.name}</strong>
                              <div className="admin-email">{admin.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{admin.department || 'Not specified'}</td>
                        <td>{admin.phone || 'Not provided'}</td>
                        <td>
                          <span 
                            className={`status-badge ${admin.isActive ? 'active' : 'inactive'}`}
                          >
                            {admin.isActive ? '🟢 Active' : '🔴 Inactive'}
                          </span>
                        </td>
                        <td>{formatDate(admin.createdAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="edit-btn"
                              onClick={() => openEditModal(admin)}
                              title="Edit Admin"
                            >
                              ✏️
                            </button>
                            <button 
                              className={`toggle-btn ${admin.isActive ? 'deactivate' : 'activate'}`}
                              onClick={() => handleToggleAdminStatus(admin, admin.isActive ? 'deactivate' : 'reactivate')}
                              title={admin.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {admin.isActive ? '⏸️' : '▶️'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Create Admin Tab */}
        {activeTab === 'create' && (
          <div className="create-admin">
            <div className="form-container">
              <div className="form-header">
                <h3>Create New Hall Administrator</h3>
                <p>Add a new administrator to manage halls and booking requests</p>
              </div>

              <form onSubmit={handleCreateAdmin} className="create-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      value={createForm.confirmPassword}
                      onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      value={createForm.department}
                      onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                      placeholder="e.g., Arts College, Science College"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                      placeholder="10-digit phone number"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setCreateForm({
                      name: '',
                      email: '',
                      password: '',
                      confirmPassword: '',
                      department: '',
                      phone: ''
                    })}
                  >
                    Clear Form
                  </button>
                  <button type="submit" className="submit-btn">
                    Create Administrator
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Profile/Settings Tab */}
        {activeTab === 'profile' && (
          <div className="profile-settings">
            <div className="profile-section">
              <div className="profile-header">
                <div className="profile-avatar large">👑</div>
                <div className="profile-info">
                  <h2>{user?.name}</h2>
                  <p className="role">System Super Administrator</p>
                  <p className="department">{user?.department}</p>
                </div>
              </div>

              <div className="profile-details">
                <div className="detail-card">
                  <h4>Account Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Name:</strong> {user?.name}
                    </div>
                    <div className="info-item">
                      <strong>Email:</strong> {user?.email}
                    </div>
                    <div className="info-item">
                      <strong>Role:</strong> Super Administrator
                    </div>
                    <div className="info-item">
                      <strong>Department:</strong> {user?.department || 'System Administration'}
                    </div>
                    <div className="info-item">
                      <strong>Phone:</strong> {user?.phone || 'Not provided'}
                    </div>
                    <div className="info-item">
                      <strong>Status:</strong> <span className="status-active">Active</span>
                    </div>
                  </div>
                </div>

                <div className="detail-card">
                  <h4>System Permissions</h4>
                  <div className="permissions-list">
                    <div className="permission-item">
                      <span className="permission-icon">✅</span>
                      <span>Create & manage hall administrators</span>
                    </div>
                    <div className="permission-item">
                      <span className="permission-icon">✅</span>
                      <span>Activate/deactivate admin accounts</span>
                    </div>
                    <div className="permission-item">
                      <span className="permission-icon">✅</span>
                      <span>View system statistics and reports</span>
                    </div>
                    <div className="permission-item">
                      <span className="permission-icon">✅</span>
                      <span>Access all system configurations</span>
                    </div>
                    <div className="permission-item">
                      <span className="permission-icon">❌</span>
                      <span>Cannot create halls (admin responsibility)</span>
                    </div>
                    <div className="permission-item">
                      <span className="permission-icon">❌</span>
                      <span>Cannot approve bookings (admin responsibility)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="create-modal">
            <div className="modal-header">
              <h3>Create New Hall Administrator</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={createForm.department}
                    onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                    placeholder="e.g., Arts College"
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="10-digit number"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && selectedAdmin && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3>Edit Administrator - {selectedAdmin.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEditAdmin} className="modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    placeholder="e.g., Arts College"
                  />
                </div>
                
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="10-digit number"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Administrator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
