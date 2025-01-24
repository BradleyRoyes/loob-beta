'use client';

import React, { useState } from 'react';
import './LoobricateProfile.css';
import { useGlobalState } from './GlobalStateContext';
import TorusSphere from './TorusSphere';

interface LoobricateData {
  _id: string;
  name: string;
  description: string;
  address: string;
  addressLine1: string;
  city: string;
  adminUsername: string;
  tags: string[];
  admins: string[];
  members: string[];
  createdAt: string;
}

interface Props {
  loobricate: LoobricateData;
  onClose: () => void;
}

const LoobricateProfile: React.FC<Props> = ({ loobricate, onClose }) => {
  const { userId } = useGlobalState();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: loobricate.name,
    description: loobricate.description,
    addressLine1: loobricate.addressLine1 || '',
    city: loobricate.city || '',
    tags: loobricate.tags || [],
  });

  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = loobricate.admins.includes(userId || '');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear any previous error/success messages
    setError('');
    setSuccess('');
  };

  const handleAddTag = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...new Set([...prev.tags, newTag.trim()])] // Ensure uniqueness
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/loobricates/${loobricate._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update Loobricate');
      }

      // Update local state
      Object.assign(loobricate, formData);
      setSuccess('Loobricate updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating loobricate:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="loobricate-profile">
      <div className="loobricate-header">
        <h2>{isEditing ? 'Edit Loobricate' : loobricate.name}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="visualization-section">
        <TorusSphere loobricateId={loobricate._id} />
      </div>

      {isAdmin && !isEditing && (
        <button className="edit-button" onClick={() => setIsEditing(true)}>
          Edit Loobricate
        </button>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="edit-form">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Loobricate Name"
            className="form-input"
            required
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Description"
            className="form-input"
            required
          />
          <input
            type="text"
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleInputChange}
            placeholder="Street Address"
            className="form-input"
          />
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="City"
            className="form-input"
          />
          
          <div className="tags-section">
            <div className="tag-input-group">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                className="form-input"
              />
              <button 
                onClick={handleAddTag}
                type="button" 
                className="add-tag-button"
              >
                Add Tag
              </button>
            </div>
            <div className="tags-list">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button 
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="remove-tag"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="button-group">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="loobricate-info">
          <p className="description">{loobricate.description}</p>
          {loobricate.addressLine1 && (
            <p className="address">
              {loobricate.addressLine1}
              {loobricate.city && <>, {loobricate.city}</>}
            </p>
          )}
          
          {formData.tags.length > 0 && (
            <div className="tags-display">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="stats">
            <div className="stat">
              <span className="label">Members</span>
              <span className="value">{loobricate.members.length}</span>
            </div>
            <div className="stat">
              <span className="label">Created</span>
              <span className="value">
                {new Date(loobricate.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default LoobricateProfile; 