import React, { useState, useEffect } from 'react';
import { FaTimes, FaUserPlus, FaUserMinus } from 'react-icons/fa';
import './LoobricateAdminPanel.css';
import type { LoobricateData } from '../types/loobricate';

interface LoobricateAdminPanelProps {
  loobricateId: string;
  onClose: () => void;
  onUpdate: (updatedLoobricate: LoobricateData) => void;
}

const LoobricateAdminPanel: React.FC<LoobricateAdminPanelProps> = ({
  loobricateId,
  onClose,
  onUpdate
}) => {
  const [loobricate, setLoobricate] = useState<LoobricateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  // Initialize all state upfront, before any conditionals
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    addressLine1: '',
    city: '',
    adminUsername: '',
    adminPassword: '',
    tags: [] as string[],
    type: 'community'
  });
  const [users, setUsers] = useState({
    admins: [] as string[],
    members: [] as string[]
  });
  const [newUser, setNewUser] = useState('');
  const [userError, setUserError] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Update formData and users when loobricate data is loaded
  useEffect(() => {
    if (loobricate) {
      setFormData({
        name: loobricate.name || '',
        description: loobricate.description || '',
        addressLine1: loobricate.addressLine1 || '',
        city: loobricate.city || '',
        adminUsername: loobricate.adminUsername || '',
        adminPassword: '',
        tags: loobricate.tags || [],
        type: loobricate.type || 'community'
      });
      setUsers({
        admins: loobricate.admins || [],
        members: loobricate.members || []
      });
    }
  }, [loobricate]);

  useEffect(() => {
    const fetchLoobricateData = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await fetch(`/api/loobricates/${loobricateId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch loobricate data');
        }

        setLoobricate(data);
      } catch (error) {
        console.error('Error fetching loobricate data:', error);
        setError('Failed to load loobricate data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoobricateData();
  }, [loobricateId]);

  // Handle loading and error states
  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!loobricate) return <div className="error">No loobricate data found</div>;

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  // Handle tag changes
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setFormData(prev => ({ ...prev, tags }));
    setHasChanges(true);
  };

  // Verify user exists before adding
  const verifyUser = async (username: string) => {
    try {
      const response = await fetch('/api/auth/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) {
        throw new Error('User not found');
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };

  // Add user handler
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setIsAddingUser(true);

    try {
      const userExists = await verifyUser(newUser);
      
      if (!userExists) {
        setUserError('User not found');
        return;
      }

      setUsers(prev => ({
        ...prev,
        members: [...prev.members, newUser]
      }));
      
      setNewUser('');
      setHasChanges(true);
    } catch (error) {
      setUserError('Failed to add user');
    } finally {
      setIsAddingUser(false);
    }
  };

  // Remove user handler
  const handleRemoveUser = (username: string, type: 'admin' | 'member') => {
    setUsers(prev => ({
      ...prev,
      [type + 's']: prev[type + 's'].filter(u => u !== username)
    }));
    setHasChanges(true);
  };

  // Save changes handler
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData = {
        ...loobricate,
        ...formData,
        admins: users.admins,
        members: users.members
      };

      const response = await fetch(`/api/loobricates/${loobricateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update Loobricate');
      }

      setLoobricate(data);
      onUpdate(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save changes:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Manage {loobricate.name}</h2>
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        <button className="close-x-button" onClick={onClose}>
          &times;
        </button>
      </div>

      <div className="admin-content">
        <section className="info-section">
          <h3>Loobricate Information</h3>
          
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags.join(', ')}
              onChange={handleTagChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Admin Username</label>
            <input
              type="text"
              name="adminUsername"
              value={formData.adminUsername}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Admin Password (leave blank to keep current)</label>
            <input
              type="password"
              name="adminPassword"
              value={formData.adminPassword}
              onChange={handleInputChange}
              className="form-input"
              placeholder="••••••••"
            />
          </div>
        </section>

        <section className="users-section">
          <h3>User Management</h3>
          
          <div className="user-lists">
            <div className="admins-list">
              <h4>Administrators</h4>
              <ul>
                {users.admins.map(admin => (
                  <li key={admin}>
                    {admin}
                    <button 
                      onClick={() => handleRemoveUser(admin, 'admin')}
                      className="remove-user"
                    >
                      <FaUserMinus />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="members-list">
              <h4>Members</h4>
              <ul>
                {users.members.map(member => (
                  <li key={member}>
                    {member}
                    <button 
                      onClick={() => handleRemoveUser(member, 'member')}
                      className="remove-user"
                    >
                      <FaUserMinus />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <form onSubmit={handleAddUser} className="add-user-form">
            <input
              type="text"
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              placeholder="Enter username to add"
              className="form-input"
            />
            <button 
              type="submit" 
              className="add-user-btn"
              disabled={isAddingUser || !newUser.trim()}
            >
              <FaUserPlus /> Add User
            </button>
            {userError && <p className="error-message">{userError}</p>}
          </form>
        </section>
      </div>

      <div className="admin-footer">
        <button
          className={`save-button ${hasChanges ? 'active' : ''}`}
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default LoobricateAdminPanel; 