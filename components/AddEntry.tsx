'use client';

import React, { useState } from 'react';
import { useGlobalState } from './GlobalStateContext';
import "./AddEntry.css";

/**
 * AddEntry Component
 * This component allows logged-in users to add an entry to the Loobrary.
 * It collects the title, offering type, description, and location, and automatically
 * includes global user data (e.g., pseudonym, email, phone).
 * Location validation is included to ensure a proper address is provided.
 */
const AddEntry: React.FC = () => {
  // Access global state
  const { userId, userEmail, userPhone } = useGlobalState();

  // Local state to manage form inputs and submission status
  const [formData, setFormData] = useState({
    title: '',
    offeringType: '',
    description: '',
    location: '',
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  /**
   * Updates the formData state when form fields change.
   * @param e - Change event from input, textarea, or select elements
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Validates the form fields to ensure all required fields are filled.
   * @returns True if form is valid, false otherwise
   */
  const validateForm = () => {
    const { title, offeringType, description, location } = formData;
    if (!title || !offeringType || !description || !location) {
      setError('All fields are required.');
      return false;
    }

    // Basic validation for location (requires more robust validation in production)
    if (location.length < 5) {
      setError('Please provide a valid address.');
      return false;
    }

    return true;
  };

  /**
   * Handles form submission.
   * Validates the form, sends data to the server, and handles response.
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        pseudonym: userId || 'Anonymous', // Automatically use global pseudonym
        email: userEmail || '', // Automatically include email from global state
        phone: userPhone || '', // Automatically include phone from global state
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
      {/* If submission is successful, show success message */}
      {!submissionSuccess ? (
        <>
          <div className="gridBackground"></div>
          <div className="fadeOverlay"></div>
          <h2 className="mainTitle">Add a New Entry to the Loobrary</h2>
          <p className="description">
            This is the place to contribute something to the Loobrary. It can be anything—venues, talents, gear, and more. Add as much detail as you can. 
          </p>
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
              placeholder="Enter a valid address"
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
              className="actionButton"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </>
      ) : (
        <div className="success-message">
          <h2 className="mainTitle">Entry Added Successfully!</h2>
          <p className="description">Your contribution has been recorded.</p>
        </div>
      )}
    </div>
  );
};

export default AddEntry;
