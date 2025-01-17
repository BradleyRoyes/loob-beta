"use client";

import React, { useState } from 'react';
import { useGlobalState } from './GlobalStateContext';

interface LoobrarySignUpProps {
  onBack: () => void;
  onExplore: () => void;
}

const LoobrarySignUp: React.FC<LoobrarySignUpProps> = ({ onBack, onExplore }) => {
  const { setUserId, setPseudonym, setUserEmail, setUserPhone } = useGlobalState();
  const [currentPhase, setCurrentPhase] = useState(1); // Tracks current phase of the form
  const [formData, setFormData] = useState({
    pseudonym: '', // User's pseudonym
    password: '', // User's password
    email: '', // User's email
    phone: '', // User's phone number
  });
  const [error, setError] = useState<string>(''); // Stores error messages
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Tracks submission state
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false); // Tracks successful submission

  // Validate Phase 1 Fields: Pseudonym and Password
  const validatePhase1 = () => {
    if (!formData.pseudonym) {
      setError('Pseudonym is required.');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  // Validate Phase 2 Fields: Email (required) and Phone (optional)
  const validatePhase2 = () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('A valid email is required.');
      return false;
    }
    return true;
  };

  // Handle Input Changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Navigate to Next Phase
  const handleNext = () => {
    if (currentPhase === 1 && validatePhase1()) {
      setError('');
      setCurrentPhase(2);
    } else if (currentPhase === 2 && validatePhase2()) {
      setError('');
      handleSubmit();
    }
  };

  // Navigate to Previous Phase
  const handlePreviousPhase = () => {
    setError('');
    setCurrentPhase(currentPhase - 1);
  };

  // Handle Form Submission
  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        dataType: 'userAccount',
        createdAt: new Date().toISOString(),
      };

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmissionSuccess(true);
        setUserId(formData.pseudonym);
        setPseudonym(formData.pseudonym);
        setUserEmail(formData.email);
        setUserPhone(formData.phone);
        setCurrentPhase(3);
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

  // Render Phase 1: Create Pseudonym and Password
  const renderPhase1 = () => (
    <>
      <h2 className="title">Create a Loob Account</h2>
      <form>
        <input
          type="text"
          name="pseudonym"
          placeholder="Enter a pseudonym"
          aria-label="Pseudonym"
          value={formData.pseudonym}
          onChange={handleInputChange}
          required
          className="inputField"
        />
        <input
          type="password"
          name="password"
          placeholder="Enter a password"
          aria-label="Password"
          value={formData.password}
          onChange={handleInputChange}
          required
          className="inputField"
        />
        {error && <p className="error">{error}</p>}
        <button type="button" onClick={handleNext} className="actionButton">
          Next
        </button>
      </form>
    </>
  );

  // Render Phase 2: Email and Phone Number
  const renderPhase2 = () => (
    <>
      <h2 className="title">Contact Information</h2>
      <p className="description">Email so we can contact you about your Loobrary card. Phone number if you want to join our Telegram group.</p>
      <form>
        <input
          type="email"
          name="email"
          placeholder="Enter an email"
          aria-label="Email"
          value={formData.email}
          onChange={handleInputChange}
          required
          className="inputField"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Enter your phone number (optional)"
          aria-label="Phone"
          value={formData.phone}
          onChange={handleInputChange}
          className="inputField"
        />
        {error && <p className="error">{error}</p>}
        <div className="buttonGroup">
          <button
            type="button"
            onClick={handlePreviousPhase}
            className="actionButton secondary"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="actionButton"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </>
  );

  // Render Phase 3: Thank You Page
  const renderPhase3 = () => (
    <div className="finalPhase">
      <h2 className="mainTitle">Thanks.</h2>
      <p className="superSubtitle">Welcome to Loob. Take a look around.</p>
      <button onClick={onExplore} className="actionButton">
        Explore Loob
      </button>
    </div>
  );

  return (
    <div className="signupScreen">
      {/* Back Button */}
      <button type="button" className="topBackButton" onClick={onBack}>
        ←
      </button>

      {/* Form Container */}
      <div className="formContainer">
        {currentPhase === 1 && renderPhase1()}
        {currentPhase === 2 && renderPhase2()}
        {currentPhase === 3 && submissionSuccess && renderPhase3()}
      </div>
    </div>
  );
};

export default LoobrarySignUp;
