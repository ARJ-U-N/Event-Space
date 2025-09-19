import React, { useState } from 'react';
import '../styles/LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const loginAPI = async (credentials) => {
    console.log('Making login API request with:', {
      email: credentials.email,
      role: credentials.role,
      password: '***' // Don't log actual password
    });

    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    console.log('Login API response status:', response.status);
    console.log('Login API response ok:', response.ok);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Login API error:', errorData);
      throw new Error(errorData.message || 'Login failed');
    }
    
    const responseData = await response.json();
    console.log('Login API success response:', responseData);
    return responseData;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Form data:', {
      email: formData.email,
      role: formData.role,
      password: formData.password ? '***' : 'empty'
    });

    // Client-side validation
    if (!formData.email || !formData.password || !formData.role) {
      const missingFields = [];
      if (!formData.email) missingFields.push('email');
      if (!formData.password) missingFields.push('password');
      if (!formData.role) missingFields.push('role');
      
      const errorMsg = `Please fill in all fields: ${missingFields.join(', ')}`;
      console.error('Validation error:', errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    try {
      console.log('Making API call...');
      const response = await loginAPI(formData);
      
      // Validate response structure
      if (!response.success || !response.data || !response.data.user || !response.data.token) {
        console.error('Invalid API response structure:', response);
        throw new Error('Invalid response from server');
      }

      const { user: userData, token } = response.data;
      
      console.log('Received user data:', userData);
      console.log('Received token:', token ? 'exists' : 'missing');
      
      // Validate user data
      if (!userData.role || !userData.email || !userData.name) {
        console.error('Invalid user data structure:', userData);
        throw new Error('Invalid user data received from server');
      }

      // Validate role matches selection
      if (userData.role !== formData.role) {
        console.error('Role mismatch:', {
          selected: formData.role,
          received: userData.role
        });
        throw new Error(`Role mismatch. You selected ${formData.role} but server returned ${userData.role}`);
      }

      console.log('Storing authentication data...');
      
      // Store authentication data with error handling
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userRole', userData.role);
        
        console.log('✅ Data stored in localStorage');
      } catch (storageError) {
        console.error('❌ LocalStorage error:', storageError);
        throw new Error('Failed to store authentication data');
      }
      
      // Verify storage worked
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      const storedRole = localStorage.getItem('userRole');
      
      console.log('=== STORAGE VERIFICATION ===');
      console.log('Stored user exists:', !!storedUser);
      console.log('Stored token exists:', !!storedToken);
      console.log('Stored role:', storedRole);
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('Parsed stored user:', parsedUser);
          console.log('Parsed user role:', parsedUser.role);
        } catch (parseError) {
          console.error('Error parsing stored user:', parseError);
          throw new Error('Failed to verify stored user data');
        }
      }
      
      console.log('=== CALLING PARENT LOGIN HANDLER ===');
      console.log('Calling onLogin with user data:', userData);
      
      // Call parent callback with user data
      if (onLogin) {
        onLogin(userData);
        console.log('✅ Parent login handler called successfully');
      } else {
        console.error('❌ No onLogin callback provided');
        throw new Error('No login handler provided');
      }
      
    } catch (err) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error type:', err.name);
      console.error('Error message:', err.message);
      console.error('Full error:', err);
      
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  // Get role-specific subtitle
  const getRoleSubtitle = () => {
    switch (formData.role) {
      case 'teacher':
        return 'Browse and book halls for your programs';
      case 'admin':
        return 'Manage halls and approve booking requests';
      case 'superadmin':
        return 'Administer hall administrators';
      default:
        return 'Access Hall Management System';
    }
  };

  // Get role-specific placeholder text
  const getRolePlaceholder = () => {
    switch (formData.role) {
      case 'teacher':
        return 'teacher@nirmala.com';
      case 'admin':
        return 'admin@nirmala.com';
      case 'superadmin':
        return 'superadmin@nirmala.com';
      default:
        return 'email@domain.com';
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Branding */}
      <div className="login-left">
        <div className="logo-container">
          <img 
            src="https://event-space-ncas.web.app/src/img/nir.png" 
            alt="Nirmala Institutions" 
            className="logo" 
          />
        </div>
        <div className="event-space-container">
          <img 
            src="https://event-space-ncas.web.app/src/img/logo.png" 
            alt="Event Space" 
            className="event-space-logo"
          />
          <div className="branding-text">
            <h3>Event Space</h3>
            <p>Hall Management System</p>
          </div>
        </div>
        
        {/* Role Information Panel */}
        {formData.role && (
          <div className="role-info-panel">
            <div className="role-info">
              <h4>
                {formData.role === 'teacher' && '👨‍🏫 Teacher Portal'}
                {formData.role === 'admin' && '🏢 Hall Admin Portal'}
                {formData.role === 'superadmin' && '👑 Super Admin Portal'}
              </h4>
              <p>{getRoleSubtitle()}</p>
              
              {/* Sample credentials hint */}
              <div className="credentials-hint">
                <small>
                  <strong>Demo Account:</strong><br />
                  {formData.role === 'teacher' && 'teacher@nirmala.com / password123'}
                  {formData.role === 'admin' && 'admin@nirmala.com / password123'}
                  {formData.role === 'superadmin' && 'superadmin@nirmala.com / Super@123'}
                </small>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="form-header">
            <h2>Sign In</h2>
            <p className="subtitle">{getRoleSubtitle()}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            {/* Role Selection - First Field */}
            <div className="form-group">
              <label htmlFor="role">
                Select Your Role *
                <span className="field-hint">Choose your account type</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                disabled={loading}
                className={formData.role ? 'has-value' : ''}
              >
                <option value="">-- Select a role --</option>
                <option value="teacher">👨‍🏫 Teacher</option>
                <option value="admin">🏢 Hall Administrator</option>
                <option value="superadmin">👑 Super Administrator</option>
              </select>
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">
                Email Address *
                {formData.role && (
                  <span className="field-hint">Use your {formData.role} account</span>
                )}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={getRolePlaceholder()}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">
                Password *
                <span className="field-hint">Enter your account password</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="debug-info" style={{ 
                background: '#f0f0f0', 
                padding: '1rem', 
                borderRadius: '8px', 
                fontSize: '0.8rem',
                marginTop: '1rem'
              }}>
                <strong>Debug Info:</strong><br />
                Form valid: {formData.email && formData.password && formData.role ? '✅' : '❌'}<br />
                Role selected: {formData.role || 'none'}<br />
                Loading: {loading ? 'yes' : 'no'}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`signin-button ${loading ? 'loading' : ''} ${formData.role ? formData.role : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Signing In...
                </>
              ) : (
                <>
                  {formData.role === 'teacher' && '👨‍🏫 Sign In as Teacher'}
                  {formData.role === 'admin' && '🏢 Sign In as Admin'}
                  {formData.role === 'superadmin' && '👑 Sign In as Super Admin'}
                  {!formData.role && 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Footer Information */}
          <div className="login-footer">
            <div className="system-info">
              <p>
                <strong>Event Space</strong> - Hall Management System<br />
                <small>Nirmala College of Arts and Science</small>
              </p>
            </div>
            
            {/* Quick Access Guide */}
            <div className="quick-guide">
              <details>
                <summary>Need help? View account types</summary>
                <div className="guide-content">
                  <div className="account-type">
                    <strong>👨‍🏫 Teacher:</strong> Browse halls, submit booking requests
                  </div>
                  <div className="account-type">
                    <strong>🏢 Admin:</strong> Manage halls, approve/reject requests
                  </div>
                  <div className="account-type">
                    <strong>👑 Super Admin:</strong> Manage hall administrators
                  </div>
                </div>
              </details>
            </div>
            
            {/* Development Tools - FIXED NESTED DETAILS */}
            {process.env.NODE_ENV === 'development' && (
              <div className="dev-tools" style={{ marginTop: '1rem' }}>
                <details>
                  <summary style={{ color: '#666', fontSize: '0.8rem' }}>
                    🔧 Developer Tools
                  </summary>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    <button 
                      type="button"
                      onClick={() => {
                        console.log('=== LOCALSTORAGE DEBUG ===');
                        console.log('Token:', localStorage.getItem('token'));
                        console.log('User:', localStorage.getItem('user'));
                        console.log('UserRole:', localStorage.getItem('userRole'));
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.7rem',
                        background: '#f0f0f0',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Debug localStorage
                    </button>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
