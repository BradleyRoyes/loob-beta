'use client';

import React, { useState } from 'react';

const AddEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    offeringType: '',
    description: '',
    location: '',
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const { title, offeringType, description, location } = formData;
    if (!title || !offeringType || !description || !location) {
      setError('All fields are required.');
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
        dataType: 'userEntry',
        createdAt: new Date().toISOString(),
      };

      const response = await fetch('/api/loobrary-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmissionSuccess(true);
        setFormData({ title: '', offeringType: '', description: '', location: '' });
      } else {
        const errorData = await response.json();
        setError(errorData.error || errorData.message || 'An error occurred.');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-entry-container">
      {!submissionSuccess ? (
        <>
          <h2 className="title">Add a New Entry</h2>
          <form className="add-entry-form">
            <input
              type="text"
              name="title"
              placeholder="Enter a title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="form-input"
            />
            <select
              name="offeringType"
              value={formData.offeringType}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="">Select type</option>
              <option value="venue">Venue</option>
              <option value="talent">Talent</option>
              <option value="gear">Gear</option>
            </select>
            <textarea
              name="description"
              placeholder="Provide a description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="form-input"
            />
            <input
              type="text"
              name="location"
              placeholder="Enter a location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="form-input"
            />

            {error && <p className="error-message">{error}</p>}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </>
      ) : (
        <div className="success-message">
          <h2>Entry Added Successfully!</h2>
          <p>Your contribution has been recorded.</p>
        </div>
      )}
    </div>
  );
};

export default AddEntry;
