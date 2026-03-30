# Profile Implementation Guide for Dashboard

## Overview

This guide shows how to implement a profile feature in the dashboard that displays the admin/store manager name with a profile icon, and shows full user details with a change password option when clicked.

## API Endpoints

### 1. Get Profile
```
GET /api/auth/profile
```

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "Admin Name",
    "storeName": "Store Name",
    "mobile": "9876543210",
    "email": "admin@example.com",
    "address": "Address here",
    "role": "admin"
  }
}
```

### 2. Change Password
```
POST /api/auth/change-password
```

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "oldPassword": "current_password",
  "newPassword": "new_password_123"
}
```

## Frontend Implementation

### Complete React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProfileDropdown.css'; // Your styles

const ProfileDropdown = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fetch user profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(
        'https://pharmapay-api.onrender.com/api/auth/profile',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        'https://pharmapay-api.onrender.com/api/auth/change-password',
        {
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Close form after 2 seconds
        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordSuccess('');
        }, 2000);
      }
    } catch (error) {
      if (error.response?.data?.error) {
        setPasswordError(error.response.data.error.message);
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="profile-container">
      {/* Profile Icon with Name */}
      <div 
        className="profile-trigger"
        onClick={() => setShowProfile(!showProfile)}
      >
        <div className="profile-icon">
          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <span className="profile-name">{user.name}</span>
        <svg 
          className={`dropdown-arrow ${showProfile ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12"
        >
          <path d="M6 9L1 4h10L6 9z" fill="currentColor"/>
        </svg>
      </div>

      {/* Profile Dropdown */}
      {showProfile && (
        <div className="profile-dropdown">
          <div className="profile-header">
            <div className="profile-avatar-large">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-info">
              <h3>{user.name}</h3>
              <p className="profile-role">
                {user.role === 'admin' ? 'Administrator' : 'Store Manager'}
              </p>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user.email}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Mobile:</span>
              <span className="detail-value">{user.mobile}</span>
            </div>
            {user.storeName && (
              <div className="profile-detail-item">
                <span className="detail-label">Store:</span>
                <span className="detail-value">{user.storeName}</span>
              </div>
            )}
            {user.address && (
              <div className="profile-detail-item">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{user.address}</span>
              </div>
            )}
          </div>

          <div className="profile-actions">
            <button
              className="btn-change-password"
              onClick={() => {
                setShowChangePassword(!showChangePassword);
                setPasswordError('');
                setPasswordSuccess('');
              }}
            >
              {showChangePassword ? 'Cancel' : 'Change Password'}
            </button>
            <button
              className="btn-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          {/* Change Password Form */}
          {showChangePassword && (
            <div className="change-password-form">
              <h4>Change Password</h4>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        oldPassword: e.target.value
                      })
                    }
                    required
                    placeholder="Enter current password"
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value
                      })
                    }
                    required
                    minLength={6}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value
                      })
                    }
                    required
                    placeholder="Confirm new password"
                  />
                </div>
                {passwordError && (
                  <div className="error-message">{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className="success-message">{passwordSuccess}</div>
                )}
                <button type="submit" className="btn-submit">
                  Change Password
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {showProfile && (
        <div
          className="profile-overlay"
          onClick={() => setShowProfile(false)}
        />
      )}
    </div>
  );
};

export default ProfileDropdown;
```

## CSS Styles (ProfileDropdown.css)

```css
.profile-container {
  position: relative;
  display: inline-block;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.profile-trigger:hover {
  background-color: #f5f5f5;
}

.profile-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
}

.profile-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.dropdown-arrow {
  transition: transform 0.2s;
  color: #666;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.profile-header {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.profile-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.profile-role {
  margin: 4px 0 0 0;
  font-size: 14px;
  opacity: 0.9;
}

.profile-details {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.profile-detail-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.profile-detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
}

.detail-value {
  color: #333;
  font-size: 14px;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.profile-actions {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-change-password,
.btn-logout {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-change-password {
  background-color: #667eea;
  color: white;
}

.btn-change-password:hover {
  background-color: #5568d3;
}

.btn-logout {
  background-color: #f5f5f5;
  color: #333;
}

.btn-logout:hover {
  background-color: #e0e0e0;
}

.change-password-form {
  padding: 20px;
  border-top: 1px solid #eee;
  background-color: #f9f9f9;
}

.change-password-form h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  padding: 10px;
  background-color: #fee;
  color: #c33;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 12px;
}

.success-message {
  padding: 10px;
  background-color: #efe;
  color: #3c3;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 12px;
}

.btn-submit {
  width: 100%;
  padding: 10px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-submit:hover {
  background-color: #5568d3;
}

.profile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: transparent;
}

.profile-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## Usage in Dashboard Header

```jsx
import React from 'react';
import ProfileDropdown from './ProfileDropdown';

const DashboardHeader = () => {
  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1>Dashboard</h1>
      </div>
      <div className="header-right">
        <ProfileDropdown />
      </div>
    </header>
  );
};

export default DashboardHeader;
```

## Features

✅ **Profile Icon with Name** - Shows admin name with avatar icon  
✅ **Click to View Details** - Dropdown shows full user information  
✅ **Change Password** - Integrated password change form  
✅ **Error Handling** - Shows validation and API errors  
✅ **Success Feedback** - Confirms successful password change  
✅ **Logout Option** - Easy logout from profile dropdown  
✅ **Responsive Design** - Works on different screen sizes  
✅ **Click Outside to Close** - Overlay closes dropdown  

## API Integration Points

1. **GET /api/auth/profile** - Fetches user profile on component mount
2. **POST /api/auth/change-password** - Changes password when form is submitted

## Error Handling

The component handles:
- Network errors
- Invalid old password
- Password validation errors
- API error responses

## Security Notes

- Access token stored in localStorage
- Password fields are type="password" (masked)
- Old password verification required
- Token cleared on logout






