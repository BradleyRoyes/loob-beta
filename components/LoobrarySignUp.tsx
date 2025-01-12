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
  const [formData, setFormData] = useState({
    pseudonym: '',
    email: '',
    phone: '',
    title: '',
    offeringType: '', // 'venue', 'gear', 'talent'
    description: '',
    location: '',
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  /**
   * Handle input changes for Phase 1 (Pseudonym, Email, Phone).
   */
  const handlePhase1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle input changes for Phase 2 (Offerings).
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
   * Move to the next phase of the form, validating inputs before proceeding.
   */
  const handleNext = () => {
    if (currentPhase === 1 && (!formData.pseudonym || !formData.email)) {
      setError('Pseudonym and email are required.');
      return;
    }
    setError('');
    setCurrentPhase((prev) => prev + 1);
  };

  /**
   * Move back to the previous phase of the form.
   */
  const handlePreviousPhase = () => {
    setError('');
    setCurrentPhase((prev) => prev - 1);
  };

  /**
   * Submit the form data to the server.
   */
  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        pseudonym: formData.pseudonym,
        email: formData.email,
        phone: formData.phone,
        title: formData.title,
        offeringType: formData.offeringType, // 'venue', 'gear', or 'talent'
        description: formData.description,
        location: formData.location,
        dataType: 'userEntry',
        createdAt: new Date().toISOString(),
      };

      const response = await fetch('/api/populateUserEntries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSubmissionSuccess(true);
        setUserId(formData.pseudonym);
        setCurrentPhase(3);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'An error occurred.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signupScreen">
      <button
        type="button"
        className={`topBackButton ${currentPhase === 3 ? 'bigBackButton' : ''}`}
        onClick={onBack}
      >
        ←
      </button>
      <div className="formContainer">
        {currentPhase === 1 && (
          <>
            <h2 className="title">Get your Loobrary card here</h2>
            <p className="description">
              Your Loobrary card is your key to the Loob ecosystem of talent, gear, and spaces. It
              just takes two minutes to sign up.
            </p>
            <form className="form">
              <div className="formGroup">
                <label htmlFor="pseudonym">
                  Pseudonym <span className="info">(To remember you)</span>
                  <input
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
                  Phone <span className="info">(Optional)</span>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handlePhase1Change}
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
        {currentPhase === 2 && (
          <>
            <form className="form">
              <h2 className="title">Can you offer something to the Loobrary?</h2>
              <p className="description">
                The Loobrary thrives on community contributions. Whether it’s a venue, talent, or
                gear, your offer helps others and builds the community.
              </p>
              <div className="formGroup">
                <label htmlFor="title">
                  Title
                  <input
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
