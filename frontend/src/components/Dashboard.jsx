import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

const Dashboard = ({ onNavigate }) => {
  const [halls, setHalls] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState({ name: 'SWIPE' });
  const [loading, setLoading] = useState(true);

  const fetchHalls = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/halls', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  };

  useEffect(() => {
    const loadHalls = async () => {
      try {
        const response = await fetchHalls();
        setHalls(response.data);
      } catch (error) {
        console.error('Error loading halls:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHalls();
  }, []);

  const handleBook = (hall) => {
    onNavigate('booking', hall);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const filteredHalls = halls.filter(hall =>
    hall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hall.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="logo-section">
         
          <img 
            src="https://event-space-ncas.web.app/Dashboard/src/img/logo.png" 
            alt="Event Space" 
            className="event-space-logo"
          />
        </div>
        
        <nav className="nav-menu">
          <div className="nav-item active">
            <i className="icon-dashboard"></i>
            <span>Dashboard</span>
          </div>
          <div className="nav-item" onClick={() => onNavigate('bookings')}>
            <i className="icon-bookings"></i>
            <span>Your Bookings</span>
          </div>
          <div className="nav-item">
            <i className="icon-settings"></i>
            <span>Settings</span>
          </div>
          <div className="nav-item logout" onClick={handleLogout}>
            <i className="icon-logout"></i>
            <span>Log Out</span>
          </div>
        </nav>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <i className="search-icon"></i>
          </div>
          
          <div className="user-profile">
            <div className="profile-icon">👤</div>
            <span className="username">{user.name}</span>
          </div>
        </div>

        <div className="welcome-section">
          <h1>Hello {user.name}!</h1>
          <p>Book your hall now</p>
        </div>

      
        <div className="halls-grid">
          {loading ? (
            <div className="loading">Loading halls...</div>
          ) : (
            filteredHalls.map((hall) => (
              <div key={hall._id} className="hall-card">
                <div className="hall-card-background">
                  <div className="hall-overlay">
                    <div className="hall-number">{hall.number}</div>
                    <div className="hall-info">
                      <h2 className="hall-name">{hall.name}</h2>
                      <p className="hall-location">{hall.location}</p>
                      <div className="hall-details">
                        <span className="hall-features">{hall.features}</span>
                        {hall.capacity && (
                          <span className="hall-capacity">
                            <i className="capacity-icon">👥</i>
                            {hall.capacity}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      className="book-button"
                      onClick={() => handleBook(hall)}
                    >
                      BOOK
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
