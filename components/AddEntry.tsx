'use client';

import React, { useState } from 'react';
import { FaMapMarkerAlt, FaUser, FaTools, FaUsers } from 'react-icons/fa';
import './AddEntry.css';
import { useGlobalState } from '../components/GlobalStateContext';

const AddEntry = () => {
  const { pseudonym, email, phone } = useGlobalState();
  const [selectedType, setSelectedType] = useState<string>('Loobricate'); // Default open form
  const [formData, setFormData] = useState<Record<string, any>>({
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
  const [currentTag, setCurrentTag] = useState({ category: '', value: '', isCustom: false });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  const predefinedCategories = ['Select a category', 'Capacity', 'Cost', 'Specs', 'Availability', 'Add Your Own'];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
    setCurrentTag({ category: '', value: '', isCustom: false });
    setError('');
  };

  const handleTagRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleTypeSelection = (type: string) => {
    setSelectedType(type);
    setFormData((prev) => ({ ...prev, offeringType: type.toLowerCase() }));
  };

  const handleSubmit = async () => {
    if (selectedType === 'Loobricate') {
      if (!formData.name || !formData.description || !formData.address || !formData.adminUsername || !formData.adminPassword) {
        setError('Please fill in all required fields for Loobricate.');
        return;
      }
    } else if (!formData.title || !formData.description || !formData.location) {
      setError('Please fill in all required fields for this entry.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const payload = { ...formData, dataType: selectedType };
      const endpoint =
        selectedType === 'Loobricate' ? '/api/loobricates' : '/api/loobrary-signup';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmissionSuccess(true);
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
        });
      } else {
        setError(result.error || 'An error occurred.');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="tag-description">
              <p>Tags help categorize and provide detailed information about your entry. For example:</p>
              <ul>
                <li><strong>Category:</strong> Capacity</li>
                <li><strong>Value:</strong> 200 seats with comfortable spacing</li>
              </ul>
            </div>
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
                placeholder="Enter detailed value for the tag (e.g., 'Fits 300 people with extra amenities')"
                value={currentTag.value}
                onChange={(e) => setCurrentTag((prev) => ({ ...prev, value: e.target.value }))}
                className="form-input tag-value-input"
              />
              <button onClick={handleAddTag} className="small-plus">+</button>
            </div>
            {formData.tags.map((tag, index) => (
              <div key={index} className="tag-item">
                <span className="tag-label">
                  {tag.category}: {tag.value}
                </span>
                <button className="remove-tag" onClick={() => handleTagRemove(index)}>
                  Remove
                </button>
              </div>
            ))}
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
