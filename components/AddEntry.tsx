'use client';

import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUser, FaTools, FaUsers } from 'react-icons/fa';
import './AddEntry.css';
import { useGlobalState } from '../components/GlobalStateContext';

// Add this new type for tag keywords
type TagKeyword = string;

// Define the overall structure of the formData state
interface FormData {
  pseudonym: string;
  email: string;
  phone: string;
  password: string;
  title: string;
  offeringType: string;
  description: string;
  location: string;
  name: string;
  address: string;
  adminUsername: string;
  adminPassword: string;
  tags: TagKeyword[]; // Changed from Tag[] to TagKeyword[]
  addressLine1: string;
  city: string;
  loobricateId: string; // Add this field for associating entries with a Loobricate
}

const AddEntry: React.FC = () => {
  // Pull initial values from global state
  const { pseudonym, email, phone } = useGlobalState();

  // Default form type is set to "Location"
  const [selectedType, setSelectedType] = useState<string>('Location');

  // Initialize the form data state with default values
  const [formData, setFormData] = useState<FormData>({
    pseudonym: pseudonym || 'Anonymously Contributed',
    email: email || 'Anonymously Contributed',
    phone: phone || 'N/A',
    password: 'default-password',
    title: '',
    offeringType: '',
    description: '',
    location: '',
    name: '',
    address: '',
    adminUsername: '',
    adminPassword: '',
    tags: [],
    addressLine1: '',
    city: '',
    loobricateId: '',
  });

  // Replace the currentTag state with a simpler keyword input
  const [tagInput, setTagInput] = useState<string>('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // State to handle errors and submission states
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  // Predefined tag categories
  const predefinedCategories = ['Select a category', 'Capacity', 'Cost', 'Specs', 'Availability', 'Add Your Own'];

  // Add state for available Loobricates
  const [availableLoobricates, setAvailableLoobricates] = useState<Array<{id: string, name: string}>>([]);

  // Fetch available Loobricates on component mount
  useEffect(() => {
    const fetchLoobricates = async () => {
      try {
        const response = await fetch('/api/loobricates');
        const data = await response.json();
        setAvailableLoobricates(data);
      } catch (error) {
        console.error('Error fetching Loobricates:', error);
      }
    };
    fetchLoobricates();
  }, []);

  // Update form data state when an input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add this function to handle tag suggestions
  const handleTagInputChange = async (value: string) => {
    setTagInput(value);
    if (value.length >= 2) {
      try {
        const response = await fetch(`/api/tag-suggestions?query=${value}`);
        const suggestions = await response.json();
        setSuggestedTags(suggestions);
      } catch (error) {
        console.error('Error fetching tag suggestions:', error);
      }
    } else {
      setSuggestedTags([]);
    }
  };

  // Update the handleAddTag function
  const handleAddTag = () => {
    if (formData.tags.length >= 5) {
      setError('You can add up to 5 tags only.');
      return;
    }
    if (!tagInput.trim()) {
      setError('Please enter a tag keyword.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()],
    }));
    setTagInput(''); // Reset input
    setError('');
  };

  // Remove a tag by its index
  const handleTagRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index), // Filter out the tag at the given index
    }));
  };

  // Update the selected form type
  const handleTypeSelection = (type: string) => {
    setSelectedType(type);
    setFormData((prev) => ({ ...prev, offeringType: type.toLowerCase() }));
  };

  // Submit the form data
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      // Prepare the submission data
      const submissionData = {
        ...formData,
        dataType: selectedType === 'Loobricate' ? 'loobricate' : 'userEntry',
        offeringType: selectedType.toLowerCase(),
        // Add these for non-Loobricate entries
        ...(selectedType !== 'Loobricate' && {
          loobricates: [formData.loobricateId],
          pseudonym: pseudonym || 'Anonymously Contributed',
          email: email || 'Anonymously Contributed',
          phone: phone || 'N/A',
        })
      };

      const response = await fetch('/api/loobrary-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit entry');
      }

      setSubmissionSuccess(true);
      // Reset form
      setFormData({
        pseudonym: pseudonym || 'Anonymously Contributed',
        email: email || 'Anonymously Contributed',
        phone: phone || 'N/A',
        password: 'default-password',
        title: '',
        offeringType: '',
        description: '',
        location: '',
        name: '',
        address: '',
        adminUsername: '',
        adminPassword: '',
        tags: [],
        addressLine1: '',
        city: '',
        loobricateId: '',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update renderFormFields to use the address autocomplete
  const renderFormFields = () => {
    switch (selectedType) {
      case 'Location':
      case 'Talent':
      case 'Gear':
        return (
          <>
            <p className="info-text">{`Add a new ${selectedType.toLowerCase()} to the Loobrary.`}</p>
            <input
              type="text"
              name="title"
              placeholder={`${selectedType} Name`}
              value={formData.title || ''}
              onChange={handleInputChange}
              className="form-input"
            />
            <textarea
              name="description"
              placeholder={`Describe the ${selectedType.toLowerCase()}.`}
              value={formData.description || ''}
              onChange={handleInputChange}
              className="form-input"
            />
            <input
              type="text"
              name="location"
              placeholder={`Location of the ${selectedType.toLowerCase()}`}
              value={formData.location || ''}
              onChange={handleInputChange}
              className="form-input"
            />
          </>
        );
      case 'Loobricate':
        return (
          <>
            <p className="info-text">Provide all required information for Loobricate setup.</p>
            <input
              type="text"
              name="name"
              placeholder="Loobricate Name"
              value={formData.name || ''}
              onChange={handleInputChange}
              className="form-input"
            />
            <textarea
              name="description"
              placeholder="Describe the Loobricate."
              value={formData.description || ''}
              onChange={handleInputChange}
              className="form-input"
            />
            <input
              type="text"
              name="addressLine1"
              placeholder="Street Address (e.g., 123 Main St)"
              value={formData.addressLine1 || ''}
              onChange={handleInputChange}
              className="form-input"
            />
            <input
              type="text"
              name="city"
              placeholder="City, State, ZIP"
              value={formData.city || ''}
              onChange={handleInputChange}
              className="form-input"
            />
            <input
              type="text"
              name="adminUsername"
              placeholder="Admin Username"
              value={formData.adminUsername || ''}
              onChange={handleInputChange}
              className="form-input"
            />
            <input
              type="password"
              name="adminPassword"
              placeholder="Admin Password"
              value={formData.adminPassword || ''}
              onChange={handleInputChange}
              className="form-input"
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="add-entry-container">
      <h1 className="mainTitle">Add to Loob</h1>
      
      <div className="entry-type-sections">
        <div className="loobricate-section">
          <h2 className="section-title">Create a Loobricate</h2>
          <div className="entry-type-icons">
            <FaUsers
              className={`icon loobricate-icon ${selectedType === 'Loobricate' ? 'active' : ''}`}
              onClick={() => handleTypeSelection('Loobricate')}
            />
          </div>
          <p className="loobricate-description">
            Create a dedicated space for your community to share and collaborate
          </p>
        </div>

        <div className="loobrary-section">
          <h2 className="section-title">Add to Loobrary</h2>
          <p className="section-description">
            Add resources to an existing Loobricate community
          </p>
          <div className="entry-type-icons">
            <FaMapMarkerAlt
              className={`icon ${selectedType === 'Location' ? 'active' : ''}`}
              onClick={() => handleTypeSelection('Location')}
            />
            <FaUser
              className={`icon ${selectedType === 'Talent' ? 'active' : ''}`}
              onClick={() => handleTypeSelection('Talent')}
            />
            <FaTools
              className={`icon ${selectedType === 'Gear' ? 'active' : ''}`}
              onClick={() => handleTypeSelection('Gear')}
            />
          </div>
        </div>
      </div>

      {selectedType && (
        <>
          <h2 className="subtitle">{selectedType === 'Loobricate' ? 'Spawn Loobricate' : `Add ${selectedType}`}</h2>
          <div className="form-container">
            {selectedType !== 'Loobricate' && (
              <div className="loobricate-select-container">
                <label htmlFor="loobricateId">Select Loobricate Community *</label>
                <select
                  id="loobricateId"
                  name="loobricateId"
                  value={formData.loobricateId}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                >
                  <option value="">Select a Loobricate...</option>
                  {availableLoobricates.map(loobricate => (
                    <option key={loobricate.id} value={loobricate.id}>
                      {loobricate.name}
                    </option>
                  ))}
                </select>
                <p className="field-description">
                  All entries must be associated with a Loobricate community
                </p>
              </div>
            )}
            {renderFormFields()}
            <div className="tag-section">
              <h3>Tags</h3>
              <div className="tag-input-container">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => handleTagInputChange(e.target.value)}
                  placeholder="Add keyword tags..."
                  className="form-input tag-input"
                />
                <button onClick={handleAddTag} className="small-plus">
                  +
                </button>
              </div>
              
              {suggestedTags.length > 0 && (
                <div className="tag-suggestions">
                  {suggestedTags.map((tag, index) => (
                    <div
                      key={index}
                      className="tag-suggestion"
                      onClick={() => {
                        setTagInput(tag);
                        setSuggestedTags([]);
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              )}

              {formData.tags.length > 0 && (
                <div className="tag-list">
                  {formData.tags.map((tag: string, index: number) => (
                    <div key={index} className="tag-item">
                      <span className="tag-label">{tag}</span>
                      <button className="remove-tag" onClick={() => handleTagRemove(index)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {error && <p className="error-message">{error}</p>}
            <button className="actionButton" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </>
      )}

      {submissionSuccess && <p className="success-message">Your entry was successfully added!</p>}
    </div>
  );
};

export default AddEntry;
