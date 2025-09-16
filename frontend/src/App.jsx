
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import YourBookings from './components/YourBookings';
import BookingCalendar from './components/BookingCalendar';
import BookingForm from './components/BookingForm';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedHall, setSelectedHall] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleNavigation = (page, hallData = null, dateData = null) => {
    console.log('Navigating to:', page, hallData, dateData);
    setCurrentPage(page);
    if (hallData) {
      setSelectedHall(hallData);
    }
    if (dateData) {
      setSelectedDate(dateData);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      {currentPage === 'dashboard' && (
        <Dashboard onNavigate={handleNavigation} />
      )}
      {currentPage === 'bookings' && (
        <YourBookings onNavigate={handleNavigation} />
      )}
      {currentPage === 'booking' && (
        <BookingCalendar 
          onNavigate={handleNavigation} 
          selectedHall={selectedHall} 
        />
      )}
      {currentPage === 'bookingform' && (
        <BookingForm 
          onNavigate={handleNavigation} 
          selectedHall={selectedHall}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
}

export default App;
