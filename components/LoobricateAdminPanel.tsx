import React, { useState, useEffect } from 'react';
import { FaTimes, FaUserPlus, FaUserMinus } from 'react-icons/fa';
import './LoobricateAdminPanel.css';
import type { LoobricateData } from '../types/loobricate';

// Define the props for the LoobricateAdminPanel component
interface LoobricateAdminPanelProps {
  loobricateId: string; // Unique identifier for the loobricate
  onClose: () => void; // Function to call when the panel is closed
  onUpdate: (updatedLoobricate: LoobricateData) => void; // Function to call when the loobricate is updated
}

// Main component for managing a loobricate
const LoobricateAdminPanel: React.FC<LoobricateAdminPanelProps> = ({
  loobricateId,
  onClose,
  onUpdate
}) => {
  // State variables to manage the loobricate data and UI states
  const [loobricate, setLoobricate] = useState<LoobricateData | null>(null); // Holds the current loobricate data
  const [isLoading, setIsLoading] = useState(true); // Loading state for fetching data
  const [error, setError] = useState<string>(''); // Error message state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    addressLine1: '',
    city: '',
    adminUsername: '',
    adminPassword: '',
    tags: [] as string[],
    type: 'community' // Default type of loobricate
  });
  const [users, setUsers] = useState({
    admins: [] as string[], // List of admin usernames
    members: [] as string[] // List of member usernames
  });
  const [newUser, setNewUser] = useState(''); // New user input state
  const [userError, setUserError] = useState(''); // Error message for user addition
  const [isAddingUser, setIsAddingUser] = useState(false); // Loading state for adding a user
  const [hasChanges, setHasChanges] = useState(false); // Track if there are unsaved changes
  const [isSaving, setIsSaving] = useState(false); // Loading state for saving changes

  // Fetch the loobricate data when the component mounts or the loobricateId changes
  useEffect(() => {
    const fetchLoobricateData = async () => {
      try {
        setIsLoading(true); // Set loading state
        setError(''); // Clear previous errors
        const response = await fetch(`/api/loobricates/${loobricateId}`); // Fetch the loobricate data
        const data = await response.json(); // Parse the response data

        // Check if the response is not OK and throw an error
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch loobricate data');
        }

        setLoobricate(data); // Set the fetched loobricate data
      } catch (error) {
        console.error('Error fetching loobricate data:', error); // Log the error
        setError('Failed to load loobricate data. Please try again.'); // Set error message
      } finally {
        setIsLoading(false); // Reset loading state
      }
    };

    fetchLoobricateData(); // Call the fetch function
  }, [loobricateId]); // Dependency array to re-fetch when loobricateId changes

  // Handle loading and error states
  if (isLoading) return <div className="loading">Loading...</div>; // Show loading message
  if (error) return <div className="error">{error}</div>; // Show error message
  if (!loobricate) return <div className="error">No loobricate data found</div>; // Show if no data is found

  // Handle input changes for form fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target; // Destructure name and value from the event target
    setFormData(prev => ({ ...prev, [name]: value })); // Update the form data state
    setHasChanges(true); // Mark that there are unsaved changes
  };

  // Save changes handler
  const handleSave = async () => {
    setIsSaving(true); // Set saving state
    try {
      // Prepare the updated data object
      const updatedData = {
        ...loobricate,
        ...formData,
        admins: users.admins,
        members: users.members
      };

      // Send a PUT request to update the loobricate data
      const response = await fetch(`/api/loobricates/${loobricateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData) // Convert updated data to JSON
      });

      const data = await response.json(); // Parse the response data

      // Check if the response is not OK and throw an error
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update Loobricate');
      }

      setLoobricate(data); // Update the local loobricate state
      onUpdate(data); // Call the onUpdate function to notify parent component
      setHasChanges(false); // Reset unsaved changes state
    } catch (error) {
      console.error('Failed to save changes:', error); // Log the error
      setError('Failed to save changes. Please try again.'); // Set error message
    } finally {
      setIsSaving(false); // Reset saving state
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
              onChange={handleInputChange}
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
      </div>
    </div>
  );
};

export default LoobricateAdminPanel; 