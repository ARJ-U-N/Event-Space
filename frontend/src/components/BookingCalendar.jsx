import React, { useState, useEffect } from 'react';
import '../styles/BookingCalendar.css';

const BookingCalendar = ({ onNavigate, selectedHall }) => {
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 8, 16)); 
  const [currentMonth, setCurrentMonth] = useState(8);
  const [currentYear, setCurrentYear] = useState(2025);
  const [dayAvailability, setDayAvailability] = useState({});
  const [user, setUser] = useState({ name: 'SWIPE' });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Updated to handle new API response structure
  const fetchDetailedAvailability = async (date, hallId) => {
    const token = localStorage.getItem('token');
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/availability/${hallId}/${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.log('API error, using mock data');
    }

    return null;
  };

  useEffect(() => {
    const loadAvailability = async () => {
      if (selectedHall?._id) {
        const availability = await fetchDetailedAvailability(selectedDate, selectedHall._id);
        if (availability) {
          setDayAvailability(prev => ({
            ...prev,
            [selectedDate.toDateString()]: availability
          }));
        }
      }
    };

    loadAvailability();
  }, [selectedDate, selectedHall]);

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateClick = async (day) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(newDate);
    
    if (selectedHall?._id) {
      const availability = await fetchDetailedAvailability(newDate, selectedHall._id);
      if (availability) {
        setDayAvailability(prev => ({
          ...prev,
          [newDate.toDateString()]: availability
        }));
      }
    }
  };

  const handleMonthChange = (month) => {
    setCurrentMonth(month);
  };

  const handleYearChange = (direction) => {
    if (direction === 'prev') {
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentYear(prev => prev + 1);
    }
  };

  const handleBookSlot = (availableSlot = null) => {
    onNavigate('bookingform', selectedHall, selectedDate, availableSlot);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toDateString();
      const isSelected = selectedDate.getDate() === day && 
                        selectedDate.getMonth() === currentMonth && 
                        selectedDate.getFullYear() === currentYear;
      const isToday = new Date().toDateString() === dateStr;
      
      const dayData = dayAvailability[dateStr];
      const hasBookings = dayData && dayData.totalBookings > 0;
      const hasAvailableSlots = dayData && dayData.availableSlots && dayData.availableSlots.length > 0;
      const isFullyBooked = hasBookings && !hasAvailableSlots;

      days.push(
        <div
          key={day}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} 
                     ${hasBookings ? 'has-bookings' : ''} ${isFullyBooked ? 'fully-booked' : ''} 
                     ${hasAvailableSlots ? 'has-available-slots' : ''}`}
          onClick={() => handleDateClick(day)}
        >
          {day}
          {hasBookings && !isFullyBooked && <div className="partial-booking-indicator">◐</div>}
          {hasBookings && isFullyBooked && <div className="fully-booked-indicator">●</div>}
          {hasAvailableSlots && <div className="available-indicator">○</div>}
        </div>
      );
    }

    return days;
  };

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase();
  };

  const formatTimeRange = (startTime, endTime) => {
    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      const hour12 = ((parseInt(hours) + 11) % 12 + 1);
      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const currentAvailability = dayAvailability[selectedDate.toDateString()];

  return (
    <div className="booking-calendar-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-section">
          <img 
            src="https://event-space-ncas.web.app/Dashboard/src/img/logo.png" 
            alt="Event Space" 
            className="event-space-logo"
          />
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

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
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

        {/* Calendar Section */}
        <div className="calendar-section">
          {/* Months Panel */}
          <div className="months-panel">
            <div className="year-navigation">
              <button 
                className="year-nav-btn"
                onClick={() => handleYearChange('prev')}
              >
                ←
              </button>
              <span className="current-year">{currentYear}</span>
              <button 
                className="year-nav-btn"
                onClick={() => handleYearChange('next')}
              >
                →
              </button>
              <button className="menu-btn">☰</button>
            </div>
            
            <div className="months-list">
              {months.map((month, index) => (
                <div
                  key={month}
                  className={`month-item ${currentMonth === index ? 'active' : ''}`}
                  onClick={() => handleMonthChange(index)}
                >
                  {month}
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Panel */}
          <div className="calendar-panel">
            <div className="calendar-header">
              <h2>{monthNames[currentMonth]} {currentYear}</h2>
            </div>
            
            <div className="calendar-grid">
              <div className="weekdays-header">
                {weekDays.map(day => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>
              <div className="days-grid">
                {renderCalendarDays()}
              </div>
            </div>
          </div>

          {/* Updated Date Info Panel */}
          <div className="date-info-panel">
            <button 
              className="close-panel-btn"
              onClick={() => onNavigate('dashboard')}
            >
              ×
            </button>
            
            <div className="selected-date-info">
              <h3>{formatSelectedDate()}</h3>
              
              <div className="availability-section">
                {/* Operating Hours Info */}
                <div className="operating-hours">
                  <small>Operating Hours: 7:00 AM - 6:00 PM</small>
                  <small>Buffer Time: 1 hour between bookings</small>
                </div>

                {/* Current Bookings */}
                {currentAvailability && currentAvailability.bookings && currentAvailability.bookings.length > 0 ? (
                  <div className="existing-bookings">
                    <h4>Current Bookings:</h4>
                    {currentAvailability.bookings.map((booking, index) => (
                      <div key={index} className="booking-item">
                        <div className="booking-title">{booking.programmeName}</div>
                        <div className="booking-time">
                          {formatTimeRange(booking.startTime, booking.endTime)}
                        </div>
                        <div className="booking-seats">{booking.numberOfSeats} seats</div>
                        <div className="booking-status">{booking.status}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-events">
                    <p>No events scheduled</p>
                  </div>
                )}

                {/* Available Time Slots */}
                {currentAvailability && currentAvailability.availableSlots && currentAvailability.availableSlots.length > 0 && (
                  <div className="available-slots">
                    <h4>Available Time Slots:</h4>
                    <div className="slots-list">
                      {currentAvailability.availableSlots.slice(0, 5).map((slot, index) => (
                        <div key={index} className="available-slot">
                          <span>{formatTimeRange(slot.startTime, slot.endTime)}</span>
                          <small>({slot.duration})</small>
                        </div>
                      ))}
                      {currentAvailability.availableSlots.length > 5 && (
                        <small>+{currentAvailability.availableSlots.length - 5} more slots available</small>
                      )}
                    </div>
                  </div>
                )}

                {/* Book Now Button */}
                {currentAvailability && currentAvailability.availableSlots && currentAvailability.availableSlots.length > 0 ? (
                  <button 
                    className="book-now-btn"
                    onClick={() => handleBookSlot()}
                  >
                    Book Custom Time
                  </button>
                ) : currentAvailability && currentAvailability.totalBookings > 0 ? (
                  <button 
                    className="book-now-btn disabled"
                    disabled
                  >
                    No Available Slots
                  </button>
                ) : (
                  <button 
                    className="book-now-btn"
                    onClick={() => handleBookSlot()}
                  >
                    Book Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
