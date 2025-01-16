'use client';

import React, { useState } from 'react';
import { FaMapMarkerAlt, FaUser, FaTools, FaUsers } from 'react-icons/fa';
import './AddEntry.css';
import { useGlobalState } from '../components/GlobalStateContext';

const AddEntry = () => {
  const { pseudonym, email, phone } = useGlobalState();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({
    pseudonym: pseudonym || 'Anonymously Contributed',
    email: email || 'Anonymously Contributed',
    phone: phone || 'N/A',
    password: 'default-password',
    title: '',
    offeringType: '',
    description: '',
    location: '',
  });
  const [error, setError] = useState<string>('');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeSelection = (type: string) => {
    setSelectedType(type);
    setFormData((prev) => ({ ...prev, offeringType: type.toLowerCase() }));
  };

  const validateForm = () => {
    const requiredFields = selectedType === 'Loobricate'
      ? ['name', 'description', 'address', 'adminUsername', 'adminPassword']
      : ['title', 'description', 'location'];

    const missing = requiredFields.filter((field) => !formData[field]);
    if (missing.length > 0) {
      setMissingFields(missing);
      setError('Please fill in the required fields.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        dataType: selectedType,
      };

      const endpoint = selectedType === 'Loobricate' ? '/api/loobricates' : '/api/loobrary-signup';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmissionSuccess(true);
        setMissingFields([]);
        setFormData({
          pseudonym: pseudonym || 'Anonymously Contributed',
          email: email || 'Anonymously Contributed',
          phone: phone || 'N/A',
          password: 'default-password',
          title: '',
          offeringType: '',
          description: '',
          location: '',
        });
      } else if (result.missingFields) {
        setMissingFields(result.missingFields);
        setError('Some fields are missing. Please complete the form.');
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
              placeholder="Brief description of the Loobricate."
              value={formData.description || ''}
              onChange={handleInputChange}
              className="form-input"
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
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

  const renderDynamicFields = () => {
    return missingFields.map((field) => (
      <div key={field} className="dynamic-field">
        <label htmlFor={field}>{field}</label>
        <input
          id={field}
          type="text"
          name={field}
          value={formData[field] || ''}
          onChange={handleInputChange}
          className="form-input"
        />
      </div>
    ));
  };

  return (
    <div className="add-entry-container">
      <h1 className="mainTitle">Add to Loob</h1>
      <div className="entry-type-icons">
        <FaMapMarkerAlt className={`icon ${selectedType === 'Location' ? 'active' : ''}`} onClick={() => handleTypeSelection('Location')} />
        <FaUser className={`icon ${selectedType === 'Talent' ? 'active' : ''}`} onClick={() => handleTypeSelection('Talent')} />
        <FaTools className={`icon ${selectedType === 'Gear' ? 'active' : ''}`} onClick={() => handleTypeSelection('Gear')} />
        <FaUsers className={`icon ${selectedType === 'Loobricate' ? 'active' : ''}`} onClick={() => handleTypeSelection('Loobricate')} />
      </div>

      {selectedType && (
        <>
          <h2 className="subtitle">
            {selectedType === 'Loobricate' ? 'Spawn Loobricate' : `Add ${selectedType}`}
          </h2>
          <div className="form-container">
            {renderFormFields()}
            {missingFields.length > 0 && (
              <div className="dynamic-fields-container">
                <h3>Additional Fields Required</h3>
                {renderDynamicFields()}
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
