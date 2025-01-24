'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  location: string; // This will be our single address field
  name: string;
  adminUsername: string;
  adminPassword: string;
  tags: TagKeyword[];
  loobricateId: string;
  latitude: number | null;
  longitude: number | null;
}

// Add this after your FormData interface
interface PlaceResult {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Add this interface for address suggestions
interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
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
    adminUsername: '',
    adminPassword: '',
    tags: [],
    loobricateId: '',
    latitude: null,
    longitude: null,
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

  // Add state for address suggestions
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Add state for success message
  const [successMessage, setSuccessMessage] = useState<string>('');

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

  // Update the geocodeAddress function to use Nominatim
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'de', // Prioritize German results
            'User-Agent': 'Loob App (your@email.com)' // Replace with your contact
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }
      
      const data = await response.json();
      if (data && data[0]) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Update searchAddresses to be non-blocking
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=de&limit=5`,
        {
          headers: {
            'Accept-Language': 'de',
            'User-Agent': 'Loob App (contact@loob.com)'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAddressSuggestions(data);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Create a debounced version of searchAddresses
  const debouncedSearch = useCallback(
    debounce((query: string) => searchAddresses(query), 300),
    []
  );

  // Update handleAddressChange to be more responsive
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, location: value }));
    
    // Don't block the input, just trigger the search
    if (value.length >= 3) {
      setIsSearching(true);
      debouncedSearch(value);
    } else {
      setAddressSuggestions([]);
    }
  };

  // Update the handleSuggestionClick function
  const handleSuggestionClick = async (suggestion: AddressSuggestion) => {
    setFormData(prev => ({
      ...prev,
      location: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon)
    }));
    setAddressSuggestions([]);
  };

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

  // Define AddressInput as a nested component
  const AddressInput = () => (
    <div className="address-input-container">
      <input
        type="text"
        name="location"
        placeholder="Start typing an address..."
        value={formData.location}
        onChange={handleAddressChange}
        className="form-input"
        required
      />
      {isSearching && (
        <div className="search-indicator">Searching...</div>
      )}
      {addressSuggestions.length > 0 && (
        <ul className="suggestions-list">
          {addressSuggestions.map((suggestion, index) => (
            <li
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
      <p className="field-helper">
        Enter a complete address for accurate mapping
      </p>
      {formData.latitude && formData.longitude && (
        <p className="location-confirmation">✓ Location confirmed on map</p>
      )}
    </div>
  );

  // Update the renderFormFields function
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
            <AddressInput />
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
            <AddressInput />
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

  // Add these validation functions
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.location || (!formData.latitude && !formData.longitude)) {
      errors.push('Please select a valid address from the suggestions');
    }

    if (selectedType === 'Loobricate') {
      if (!formData.name?.trim()) errors.push('Loobricate name is required');
      if (!formData.adminUsername?.trim()) errors.push('Admin username is required');
      if (!formData.adminPassword?.trim()) errors.push('Admin password is required');
      if (formData.adminPassword?.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
    } else {
      if (!formData.loobricateId) errors.push('Please select a Loobricate community');
      if (!formData.title?.trim()) errors.push(`${selectedType} name is required`);
    }

    if (!formData.description?.trim()) {
      errors.push('Description is required');
    }

    return errors;
  };

  // Update handleSubmit with better error/success handling
  const handleSubmit = async () => {
    try {
      setError('');
      setSuccessMessage('');
      
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(validationErrors.join('\n'));
        return;
      }

      setIsSubmitting(true);

      // Prepare the base submission data
      const baseData = {
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        description: formData.description,
        tags: formData.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      // Prepare type-specific data
      const submissionData = selectedType === 'Loobricate' 
        ? {
            ...baseData,
            dataType: 'loobricate',
            name: formData.name,
            adminUsername: formData.adminUsername,
            adminPassword: formData.adminPassword,
            members: [],
            admins: []
          }
        : {
            ...baseData,
            dataType: 'userEntry',
            offeringType: selectedType.toLowerCase(),
            title: formData.title,
            loobricateId: formData.loobricateId,
            pseudonym: pseudonym || 'Anonymously Contributed',
            email: email || 'Anonymously Contributed',
            phone: phone || 'N/A'
          };

      const response = await fetch('/api/loobrary-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit entry');
      }

      // Set success message based on type
      const successMsg = selectedType === 'Loobricate'
        ? `🎉 Successfully created new Loobricate: "${formData.name}"`
        : `✨ Successfully added ${selectedType.toLowerCase()} "${formData.title}" to ${
            availableLoobricates.find(l => l.id === formData.loobricateId)?.name || 'Loobricate'
          }`;

      setSuccessMessage(successMsg);
      setSubmissionSuccess(true);
      resetForm();

    } catch (error) {
      let errorMsg = '';
      if (error instanceof Error) {
        // Friendly error messages
        switch (true) {
          case error.message.includes('duplicate'):
            errorMsg = selectedType === 'Loobricate'
              ? '⚠️ This Loobricate name is already taken. Please choose another name.'
              : '⚠️ This entry already exists in the selected Loobricate.';
            break;
          case error.message.includes('validation'):
            errorMsg = '⚠️ Please check all required fields and try again.';
            break;
          case error.message.includes('coordinates'):
            errorMsg = '⚠️ Please select a valid address from the suggestions.';
            break;
          default:
            errorMsg = '⚠️ ' + error.message;
        }
      } else {
        errorMsg = '⚠️ An unexpected error occurred. Please try again.';
      }
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset the form
  const resetForm = () => {
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
      adminUsername: '',
      adminPassword: '',
      tags: [],
      loobricateId: '',
      latitude: null,
      longitude: null,
    });
    setTagInput('');
    setSuggestedTags([]);
    setError('');
    setSubmissionSuccess(false);
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
            {error && (
              <div className="message error-container">
                <p className="error-message">{error}</p>
                <div className="error-help">
                  <p>Please check:</p>
                  <ul>
                    {selectedType === 'Loobricate' ? (
                      <>
                        <li>Loobricate name is unique and filled</li>
                        <li>Admin username and password are set</li>
                        <li>Location is selected from suggestions</li>
                        <li>Description explains the purpose of your Loobricate</li>
                      </>
                    ) : (
                      <>
                        <li>A Loobricate community is selected</li>
                        <li>Title and description are filled</li>
                        <li>Location is selected from suggestions</li>
                        <li>All required fields are complete</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}
            <button className="actionButton" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </>
      )}

      {successMessage && (
        <div className="message success-container">
          <p className="success-message">{successMessage}</p>
          <p className="success-help">
            {selectedType === 'Loobricate'
              ? 'Your Loobricate is ready! You can now start adding entries to your community.'
              : 'Your entry has been added successfully! Add more or explore the Loobrary.'}
          </p>
        </div>
      )}
    </div>
  );
};

// Simple debounce utility function
function debounce(func: Function, wait: number) {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default AddEntry;
