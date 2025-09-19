import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import YourBookings from './components/YourBookings';
import BookingCalendar from './components/BookingCalendar';
import BookingForm from './components/BookingForm';
import AdminDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedHall, setSelectedHall] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('Checking auth status...');
      console.log('Token:', token ? 'exists' : 'missing');
      console.log('User data:', userData ? 'exists' : 'missing');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        console.log('Parsed user:', parsedUser);
        console.log('User role:', parsedUser.role);
        
        // Validate that user object has required properties
        if (parsedUser && parsedUser.role && parsedUser.email) {
          setUser(parsedUser);
          setIsAuthenticated(true);
          console.log('Authentication successful for role:', parsedUser.role);
        } else {
          console.error('Invalid user data structure:', parsedUser);
          clearAuthData();
        }
      } else {
        console.log('No authentication data found');
        clearAuthData();
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    setUser(null);
    setIsAuthenticated(false);
  };

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

  const handleLogin = (userData) => {
    console.log('Login handler called with user data:', userData);
    
    // Validate user data before setting
    if (!userData || !userData.role || !userData.email) {
      console.error('Invalid user data received in handleLogin:', userData);
      return;
    }
    
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
    
    console.log('Login successful, user role:', userData.role);
  };

  const handleLogout = () => {
    console.log('Logging out...');
    clearAuthData();
    setCurrentPage('dashboard');
  };

  // Loading screen
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading-spinner">Loading...</div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ROLE-BASED DASHBOARD RENDERING WITH DEBUG INFO
  const renderRoleBasedContent = () => {
    console.log('Rendering content for user:', user);
    console.log('User role:', user.role);

    // ADMIN DASHBOARD (Only for admin role)
    if (user.role === 'admin') {
      console.log('Rendering AdminDashboard');
      return <AdminDashboard onLogout={handleLogout} />;
    }

    // SUPER ADMIN DASHBOARD (Only for superadmin role)
    if (user.role === 'superadmin') {
      console.log('Rendering SuperAdminDashboard');
      return <SuperAdminDashboard onLogout={handleLogout} />;
    }

    // TEACHER DASHBOARD (Your existing teacher system)
    if (user.role === 'teacher') {
      console.log('Rendering Teacher Dashboard System');
      return (
        <>
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
        </>
      );
    }

    // FALLBACK: Unknown role
    console.error('Unknown user role:', user.role);
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h2>Access Error</h2>
        <p>Unknown user role: <strong>{user.role}</strong></p>
        <p>Available roles: teacher, admin, superadmin</p>
        <p>Please contact system administrator.</p>
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <strong>Debug Info:</strong>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
        <button 
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            marginTop: '20px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout & Try Again
        </button>
      </div>
    );
  };

  return (
    <div className="App">
      {renderRoleBasedContent()}
    </div>
  );
}

export default App;
