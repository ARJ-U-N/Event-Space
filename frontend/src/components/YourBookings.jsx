import React, { useState, useEffect } from 'react';
import '../styles/YourBookings.css';

const YourBookings = ({ onNavigate }) => {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState({ name: 'SWIPE' });
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/bookings', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  };

  const editBooking = async (bookingId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Booking edit form opened' });
      }, 500);
    });
  };

  const cancelBooking = async (bookingId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  };

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const response = await fetchBookings();
        setBookings(response.data || []);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  const handleEdit = async (bookingId, hallName) => {
    try {
      await editBooking(bookingId);
      alert(`Opening edit form for ${hallName} booking`);
    } catch (error) {
      alert('Error opening edit form. Please try again.');
    }
  };

  const handleCancel = async (bookingId, hallName) => {
    const confirmed = window.confirm(`Are you sure you want to cancel the ${hallName} booking?`);
    if (confirmed) {
      try {
        await cancelBooking(bookingId);
        setBookings(prev => prev.filter(booking => booking._id !== bookingId));
        alert(`${hallName} booking cancelled successfully`);
      } catch (error) {
        alert('Error cancelling booking. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDuration = (duration) => {
    const durationMap = {
      'half-day-morning': 'Half Day Morning',
      'half-day-afternoon': 'Half Day Afternoon',
      'full-day': 'Full Day',
      '2-hours': '2 Hours',
      '4-hours': '4 Hours'
    };
    return durationMap[duration] || duration;
  };

  return (
    <div className="bookings-container">
      <div className="sidebar">
        <div className="logo-section">
          <div className="logo-text">
            <img 
            src="https://event-space-ncas.web.app/Dashboard/src/img/logo.png" 
            alt="Event Space" 
            className="event-space-logo"
          />
          </div>
        </div>
        
        <nav className="nav-menu">
          <div className="nav-item" onClick={() => onNavigate('dashboard')}>
            <i className="icon-dashboard"></i>
            <span>Dashboard</span>
          </div>
          <div className="nav-item active">
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
              className="search-input"
            />
            <i className="search-icon">🔍</i>
          </div>
          
          <div className="user-profile">
            <div className="profile-icon">👤</div>
            <span className="username">{user.name}</span>
          </div>
        </div>

        <div className="page-title">
          <div className="title-accent"></div>
          <h1>YOUR BOOKINGS</h1>
        </div>

        <div className="bookings-grid">
          {loading ? (
            <div className="loading">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="no-bookings">No bookings found</div>
          ) : (
            bookings.map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-date-header">
                  {formatDate(booking.eventDate)}
                </div>
                
                <div className="booking-content">
                  <div className="booking-hall">
                    <h3>{booking.hall?.name || 'Unknown Hall'}</h3>
                    <span className={`status-badge ${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="booking-details">
                    <div className="detail-row">
                      <span className="detail-label">Program:</span>
                      <span className="detail-value">{booking.programmeName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{formatDuration(booking.duration)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Time:</span>
                      <span className="detail-value">{booking.timeSlot?.startTime} - {booking.timeSlot?.endTime}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Guests:</span>
                      <span className="detail-value">{booking.guestsAttending ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Seats:</span>
                      <span className="detail-value">{booking.numberOfSeats}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Booked on:</span>
                      <span className="detail-value">{formatDate(booking.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="booking-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(booking._id, booking.hall?.name)}
                    >
                      Edit
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => handleCancel(booking._id, booking.hall?.name)}
                    >
                      Cancel
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

export default YourBookings;
