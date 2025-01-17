'use client';

import React, { useState } from 'react';
import { FaMapMarkerAlt, FaUser, FaTools, FaUsers } from 'react-icons/fa';
import './AddEntry.css';
import { useGlobalState } from '../components/GlobalStateContext';

// Define a type for the "Tag" structure
type Tag = {
  category: string; // The category of the tag, e.g., 'Capacity'
  value: string; // The value associated with the tag, e.g., 'Fits 300 people'
};

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
  tags: Tag[]; // An array of tags
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
  });

  // State to manage the currently entered tag
  const [currentTag, setCurrentTag] = useState<Tag & { isCustom: boolean }>({
    category: '',
    value: '',
    isCustom: false,
  });

  // State to handle errors and submission states
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  // Predefined tag categories
  const predefinedCategories = ['Select a category', 'Capacity', 'Cost', 'Specs', 'Availability', 'Add Your Own'];

  // Update form data state when an input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add a new tag to the tags array
  const handleAddTag = () => {
    if (formData.tags.length >= 5) {
      setError('You can add up to 5 tags only.');
      return;
    }
    if (!currentTag.category || !currentTag.value || currentTag.category === 'Select a category') {
      setError('Please select a valid category and provide a value for the tag.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, { category: currentTag.category, value: currentTag.value }],
    }));
    setCurrentTag({ category: '', value: '', isCustom: false }); // Reset the current tag input
    setError(''); // Clear errors
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
    // Validate fields based on the selected type
    if (selectedType === 'Loobricate') {
      if (!formData.name || !formData.description || !formData.address || !formData.adminUsername || !formData.adminPassword) {
        setError('Please fill in all required fields for Loobricate.');
        return;
      }
    } else if (!formData.title || !formData.description || !formData.location) {
      setError('Please fill in all required fields for this entry.');
      return;
    }

    setError(''); // Clear errors
    setIsSubmitting(true); // Start submission process

    try {
      const payload = { ...formData, dataType: selectedType }; // Prepare payload
      const endpoint = selectedType === 'Loobricate' ? '/api/loobricates' : '/api/loobrary-signup';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmissionSuccess(true); // Mark success
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
        }); // Reset form
      } else {
        setError(result.error || 'An error occurred.'); // Handle error
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false); // End submission process
    }
  };

  // Render the appropriate form fields based on the selected type
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
              name="address"
              placeholder="Loobricate Address"
              value={formData.address || ''}
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
        <FaUsers
          className={`icon ${selectedType === 'Loobricate' ? 'active' : ''}`}
          onClick={() => handleTypeSelection('Loobricate')}
        />
      </div>

      {selectedType && (
        <>
          <h2 className="subtitle">{selectedType === 'Loobricate' ? 'Spawn Loobricate' : `Add ${selectedType}`}</h2>
          <div className="form-container">
            {renderFormFields()}
            <h3>Tags</h3>
            <div className="tag-section">
              <select
                value={currentTag.isCustom ? 'Add Your Own' : currentTag.category}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'Add Your Own') {
                    setCurrentTag({ category: '', value: '', isCustom: true });
                  } else {
                    setCurrentTag({ category: value, value: '', isCustom: false });
                  }
                }}
                className="form-input tag-category-selector"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {predefinedCategories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {currentTag.isCustom && (
                <input
                  type="text"
                  placeholder="Enter your custom category"
                  value={currentTag.category}
                  onChange={(e) => setCurrentTag((prev) => ({ ...prev, category: e.target.value }))}
                  className="form-input"
                />
              )}
              <textarea
                placeholder="Enter value for the tag"
                value={currentTag.value}
                onChange={(e) => setCurrentTag((prev) => ({ ...prev, value: e.target.value }))}
                className="form-input"
              />
              <button onClick={handleAddTag} className="small-plus">
                +
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="tag-list">
                {formData.tags.map((tag: Tag, index: number) => (
                  <div key={index} className="tag-item">
                    <span className="tag-label">
                      <strong>{tag.category}:</strong> {tag.value}
                    </span>
                    <button className="remove-tag" onClick={() => handleTagRemove(index)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
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
