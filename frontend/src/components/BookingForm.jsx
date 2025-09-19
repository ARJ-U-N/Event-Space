import React, { useState } from 'react';
import '../styles/BookingForm.css';

const BookingForm = ({ onNavigate, selectedHall, selectedDate }) => {
  const [formData, setFormData] = useState({
    programmeName: '',
    startTime: '',
    endTime: '',
    numberOfSeats: '',
    bookingDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    guestsAttending: false,
    acRequired: false,
    projectorRequired: false,
    extraRequirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ name: 'SWIPE' });
  const [timeError, setTimeError] = useState('');

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

  const validateTimeSlot = (startTime, endTime) => {
    if (!startTime || !endTime) return '';

    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const operatingStart = 7 * 60;
    const operatingEnd = 18 * 60;

    if (startMinutes < operatingStart || endMinutes > operatingEnd) {
      return 'Booking time must be between 7:00 AM and 6:00 PM';
    }

    if (endMinutes <= startMinutes) {
      return 'End time must be after start time';
    }

    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 60) {
      return 'Minimum booking duration is 1 hour';
    }

    return '';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'startTime' || name === 'endTime') {
      const newFormData = { ...formData, [name]: value };
      const error = validateTimeSlot(newFormData.startTime, newFormData.endTime);
      setTimeError(error);
    }
  };

  const handleToggleChange = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getDurationText = () => {
    if (!formData.startTime || !formData.endTime) return '';
    
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = timeToMinutes(formData.startTime);
    const endMinutes = timeToMinutes(formData.endTime);
    const durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes <= 0) return '';
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const error = validateTimeSlot(formData.startTime, formData.endTime);
    if (error) {
      setTimeError(error);
      return;
    }

    setLoading(true);

    try {
      const bookingData = {
        hallId: selectedHall?._id, 
        programmeName: formData.programmeName,
        eventDate: formData.bookingDate, 
        startTime: formData.startTime,
        endTime: formData.endTime,
        numberOfSeats: parseInt(formData.numberOfSeats),
        guestsAttending: formData.guestsAttending,
        equipmentRequirements: {
          ac: formData.acRequired,
          projector: formData.projectorRequired
        },
        extraRequirements: formData.extraRequirements,
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
          <div className="operating-hours-info">
            <p>Operating Hours: 7:00 AM - 6:00 PM | Minimum Duration: 1 hour | Buffer Time: 1 hour between bookings</p>
          </div>

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
              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  min="07:00"
                  max="17:00"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  min="08:00"
                  max="18:00"
                  required
                />
              </div>
            </div>

            {formData.startTime && formData.endTime && !timeError && (
              <div className="duration-display">
                <span className="duration-label">Duration: </span>
                <span className="duration-value">{getDurationText()}</span>
              </div>
            )}

            {timeError && (
              <div className="time-error">
                {timeError}
              </div>
            )}

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
              <div className="form-group">
                <div className="toggle-group">
                  <label className="toggle-label">Guests attending</label>
                  <div 
                    className={`toggle-switch ${formData.guestsAttending ? 'active' : ''}`}
                    onClick={() => handleToggleChange('guestsAttending')}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <div className="toggle-group">
                  <label className="toggle-label">AC Required</label>
                  <div 
                    className={`toggle-switch ${formData.acRequired ? 'active' : ''}`}
                    onClick={() => handleToggleChange('acRequired')}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="toggle-group">
                  <label className="toggle-label">Projector Required</label>
                  <div 
                    className={`toggle-switch ${formData.projectorRequired ? 'active' : ''}`}
                    onClick={() => handleToggleChange('projectorRequired')}
                  >
                    <div className="toggle-slider"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor="extraRequirements">Extra Requirements</label>
                <textarea
                  id="extraRequirements"
                  name="extraRequirements"
                  value={formData.extraRequirements}
                  onChange={handleInputChange}
                  placeholder="Enter any additional requirements (microphone, speakers, special arrangements, etc.)"
                  rows="4"
                  maxLength="500"
                />
                <div className="character-count">
                  {formData.extraRequirements.length}/500 characters
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="book-now-btn"
              disabled={loading || !!timeError}
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
