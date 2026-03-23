import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Camera, Save } from 'lucide-react';
import { API_URL } from '../config';

function Profile() {
  const [user, setUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setProfilePicture(parsedUser.profilePicture || '');
      setPreviewImage(parsedUser.profilePicture || '');
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profilePicture })
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, profilePicture };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    if (!user || !user.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return names[0][0] + names[1][0];
    }
    return names[0][0] + (names[0][1] || '');
  };

  if (!user) {
    return <div className="profile-loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-picture-section">
            <div className="profile-picture-wrapper">
              {previewImage ? (
                <img src={previewImage} alt="Profile" className="profile-picture-large" />
              ) : (
                <div className="profile-picture-placeholder">
                  {getUserInitials()}
                </div>
              )}
              <label className="profile-picture-upload">
                <Camera size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <p className="profile-picture-hint">Click camera icon to upload photo</p>
          </div>

          <div className="profile-info-section">
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <User size={20} />
              </div>
              <div className="profile-info-content">
                <label>Full Name</label>
                <p>{user.name}</p>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Mail size={20} />
              </div>
              <div className="profile-info-content">
                <label>Email Address</label>
                <p>{user.email}</p>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Phone size={20} />
              </div>
              <div className="profile-info-content">
                <label>Phone Number</label>
                <p>{user.phone}</p>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Building size={20} />
              </div>
              <div className="profile-info-content">
                <label>Store Name</label>
                <p>{user.storeName}</p>
              </div>
            </div>
          </div>

          {message && (
            <div className={`profile-message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button
            className="profile-save-btn"
            onClick={handleSave}
            disabled={loading || profilePicture === user.profilePicture}
          >
            <Save size={18} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;
