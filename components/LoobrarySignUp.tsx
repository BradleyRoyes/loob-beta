'use client';

import React, { useState } from 'react';
import './LoobrarySignUp.css';
import { useGlobalState } from '../components/GlobalStateContext';

interface LoobrarySignUpProps {
  onBack: () => void;
  onExplore: () => void;
}

const LoobrarySignUp: React.FC<LoobrarySignUpProps> = ({ onBack, onExplore }) => {
  const { setUserId } = useGlobalState();
  const [currentPhase, setCurrentPhase] = useState(1);

  // Keep all sign-up data here, including password
  const [formData, setFormData] = useState({
    pseudonym: '',
    email: '',
    phone: '',
    title: '',
    offeringType: '', // 'venue', 'gear', 'talent'
    description: '',
    location: '',
    password: '',
  });

  // For errors, loading, & success
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  // Generate a session ID (optional)
  const [sessionId] = useState(`session-${Math.random().toString(36).substr(2, 12)}`);

  // Phase-1 input changes (pseudonym, email, phone, password)
  const handlePhase1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Phase-2 input changes (title, offeringType, description, location)
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // "Next" button from Phase 1 → Phase 2
  const handleNext = () => {
    // Quick check if pseudonym + email are provided
    if (currentPhase === 1 && (!formData.pseudonym || !formData.email)) {
      setError('Pseudonym and email are required.');
      return;
    }
    setError('');
    setCurrentPhase((prev) => prev + 1);
  };

  // "Back" button from Phase 2 → Phase 1
  const handlePreviousPhase = () => {
    setError('');
    setCurrentPhase((prev) => prev - 1);
  };

  // Final "Submit" button: send sign-up data to server
  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      // Build the payload with all fields
      const payload = {
        pseudonym: formData.pseudonym,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
        title: formData.title,
        offeringType: formData.offeringType,
        description: formData.description,
        location: formData.location,
        sessionId, // optional, in case your server route wants it
        dataType: 'userEntry', // if you need a type flag
        createdAt: new Date().toISOString(),
      };

      // POST to your sign-up route (instead of /api/populateUserEntries)
      const response = await fetch('app/api/loobrary-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Success
        setSubmissionSuccess(true);
        setUserId(formData.pseudonym); // Save pseudonym globally
        setCurrentPhase(3);
      } else {
        // Not OK → parse & show error
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
    <div className="signupScreen">
      {/* Back button at top (goes back to SplashScreen) */}
      <button
        type="button"
        className={`topBackButton ${currentPhase === 3 ? 'bigBackButton' : ''}`}
        onClick={onBack}
      >
        ←
      </button>

      <div className="formContainer">
        {/* -------------------- PHASE 1 -------------------- */}
        {currentPhase === 1 && (
          <>
            <h2 className="title">Get your Loobrary card</h2>
            <p className="description">
              Your Loobrary card is your key to the Loob talent, gear, and spaces. It
              just takes two minutes. I swear.
            </p>
            <form className="form">
              <div className="formGroup">
                <label htmlFor="pseudonym">
                  Pseudonym <span className="info">(To remember you)</span>
                  <input
                    className="loobrary-input"
                    type="text"
                    id="pseudonym"
                    name="pseudonym"
                    placeholder="Enter your pseudonym"
                    value={formData.pseudonym}
                    onChange={handlePhase1Change}
                    required
                  />
                </label>
              </div>
              <div className="formGroup">
                <label htmlFor="email">
                  Email <span className="info">(To contact you about your card)</span>
                  <input
                    className="loobrary-input"
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handlePhase1Change}
                    required
                  />
                </label>
              </div>
              <div className="formGroup">
                <label htmlFor="phone">
                  Phone <span className="info">(If you want to join the Telegram group)</span>
                  <input
                    className="loobrary-input"
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handlePhase1Change}
                  />
                </label>
              </div>

              {/* Password field */}
              <div className="formGroup">
                <label htmlFor="password">
                  Password <span className="info">(Choose a secure password)</span>
                  <input
                    className="loobrary-input"
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handlePhase1Change}
                    required
                  />
                </label>
              </div>

              {error && <p className="error">{error}</p>}
              <button type="button" onClick={handleNext}>
                Next
              </button>
            </form>
          </>
        )}

        {/* -------------------- PHASE 2 -------------------- */}
        {currentPhase === 2 && (
          <>
            <form className="form">
              <h2 className="title">Can you offer something to the Loobrary?</h2>
              <p className="description">
                The Loobrary thrives on community contributions. Whether it's a venue,
                talent, or gear, your offer helps others and builds the community.
              </p>
              <div className="formGroup">
                <label htmlFor="title">
                  Title
                  <input
                    className="loobrary-input"
                    type="text"
                    id="title"
                    name="title"
                    placeholder="Enter a title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>
              <div className="formGroup">
                <label htmlFor="offeringType">
                  Type
                  <select
                    className="loobrary-input"
                    id="offeringType"
                    name="offeringType"
                    value={formData.offeringType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="venue">Venue</option>
                    <option value="talent">Talent</option>
                    <option value="gear">Gear</option>
                  </select>
                </label>
              </div>
              <div className="formGroup">
                <label htmlFor="description">
                  Description
                  <textarea
                    className="loobrary-input"
                    id="description"
                    name="description"
                    placeholder="Provide a description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>
              <div className="formGroup">
                <label htmlFor="location">
                  Location
                  <input
                    className="loobrary-input"
                    type="text"
                    id="location"
                    name="location"
                    placeholder="Enter a location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>

              {error && <p className="error">{error}</p>}

              <div className="buttonGroup">
                <button type="button" onClick={handlePreviousPhase}>
                  Back
                </button>
                <button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* -------------------- FINAL PHASE (Success) -------------------- */}
        {currentPhase === 3 && submissionSuccess && (
          <div className="finalPhase">
            <h2>Thanks for signing up!</h2>
            <p>We will contact you via email regarding your card.</p>
            <p>In the meantime, use your pseudonym to explore Loob.</p>
            <button className="exploreButton" onClick={onExplore}>
              Explore Loob
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoobrarySignUp;
