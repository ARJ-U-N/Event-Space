import React, { useState } from 'react';
import '../styles/BookingForm.css';

const BookingForm = ({ onNavigate, selectedHall, selectedDate }) => {
  const [formData, setFormData] = useState({
    programmeName: '',
    duration: '',
    numberOfSeats: '',
    bookingDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    guestsAttending: false
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ name: 'SWIPE' });

  const submitBooking = async (bookingData) => {
    const token = localStorage.getItem('token');
    
    console.log('Submitting booking data:', bookingData); 
    
    const response = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Booking failed');
    }
    
    return response.json();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggleChange = () => {
    setFormData(prev => ({
      ...prev,
      guestsAttending: !prev.guestsAttending
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      
      const bookingData = {
        hallId: selectedHall?._id, 
        programmeName: formData.programmeName,
        eventDate: formData.bookingDate, 
        duration: formData.duration,
        numberOfSeats: parseInt(formData.numberOfSeats),
        guestsAttending: formData.guestsAttending,
        notes: formData.notes || ''
      };

      console.log('Selected Hall:', selectedHall); 
      console.log('Form Data:', formData); 
      console.log('Final Booking Data:', bookingData); 

      const response = await submitBooking(bookingData);
      console.log('Booking Response:', response); 
      
      if (response.success) {
        alert(`Booking successful! Booking ID: ${response.data._id}`);
        onNavigate('bookings');
      } else {
        throw new Error(response.message || 'Booking failed');
      }
      
    } catch (error) {
      console.error('Booking Error:', error); 
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="booking-form-container">
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
              className="search-input"
            />
            <i className="search-icon">🔍</i>
          </div>
          
          <div className="user-profile">
            <div className="profile-icon">👤</div>
            <span className="username">{user.name}</span>
          </div>
        </div>

        <div className="hall-hero">
          <div className="hall-hero-background">
            <div className="hall-hero-overlay">
              <div className="hall-hero-content">
                <h1>{selectedHall?.name || 'Seminar Hall'}</h1>
                <p className="hall-location">
                  {selectedHall?.location || 'Arts College, A-Block, Ground Floor'}
                </p>
                <div className="hall-features">
                  <span>{selectedHall?.features || 'AC/NON-AC'}</span>
                  <span className="separator">||</span>
                  <span className="capacity">
                    <i className="capacity-icon">👥</i>
                    {selectedHall?.capacity || 200}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-form-section">
          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="programmeName">Programme Name</label>
                <input
                  type="text"
                  id="programmeName"
                  name="programmeName"
                  value={formData.programmeName}
                  onChange={handleInputChange}
                  placeholder="Enter programme name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration</label>
                <select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select duration</option>
                  <option value="half-day-morning">Half Day - Morning</option>
                  <option value="half-day-afternoon">Half Day - Afternoon</option>
                  <option value="full-day">Full Day</option>
                  <option value="2-hours">2 Hours</option>
                  <option value="4-hours">4 Hours</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="numberOfSeats">Number of Seats</label>
                <div className="seats-input">
                  <i className="seats-icon">👥</i>
                  <input
                    type="number"
                    id="numberOfSeats"
                    name="numberOfSeats"
                    value={formData.numberOfSeats}
                    onChange={handleInputChange}
                    placeholder="Enter number of seats"
                    min="1"
                    max={selectedHall?.capacity || 200}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="bookingDate">Booking Date</label>
                <div className="date-input">
                  <input
                    type="date"
                    id="bookingDate"
                    name="bookingDate"
                    value={formData.bookingDate}
                    onChange={handleInputChange}
                    required
                  />
                  <i className="calendar-icon">📅</i>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <div className="toggle-group">
                  <label className="toggle-label">Guests attending</label>
                  <div 
                    className={`toggle-switch ${formData.guestsAttending ? 'active' : ''}`}
                    onClick={handleToggleChange}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="book-now-btn"
              disabled={loading}
            >
              <i className="check-icon">✓</i>
              {loading ? 'Booking...' : 'Book Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
