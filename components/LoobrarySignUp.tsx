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
    offeringType: '',
    description: '',
    location: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  const validatePhase1 = () => {
    if (!formData.pseudonym || !formData.email || !formData.password) {
      setError('Pseudonym, email, and password are required.');
      return false;
    }
    return true;
  };

  const validatePhase2 = () => {
    if (
      !formData.title ||
      !formData.offeringType ||
      !formData.description ||
      !formData.location
    ) {
      setError('All fields in this step are required.');
      return false;
    }
    return true;
  };

  const handlePhase1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    if (currentPhase === 1 && validatePhase1()) {
      setError('');
      setCurrentPhase(2);
    }
  };

  const handlePreviousPhase = () => {
    setError('');
    setCurrentPhase(1);
  };

  const handleSubmit = async () => {
    if (!validatePhase2()) return;

    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        pseudonym: formData.pseudonym,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
        title: formData.title,
        offeringType: formData.offeringType,
        description: formData.description,
        location: formData.location,
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
        setUserId(formData.pseudonym);
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
            <h2 className="title">Get your Loobrary card</h2>
            <p className="description">
              Join the Loobrary beta! During this phase, we ask everyone to offer something to the
              Loobrary. This helps build a strong community.
            </p>
            <form className="form">
              <div className="formGroup">
                <label htmlFor="pseudonym">
                  Pseudonym <span className="info">(To identify you)</span>
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
                  Email <span className="info">(To contact you)</span>
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
                  Phone <span className="info">(Optional, for joining Telegram group)</span>
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
              <div className="formGroup">
                <label htmlFor="password">
                  Password <span className="info">(Choose a secure password)</span>
                  <input
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

        {currentPhase === 2 && (
          <>
            <form className="form">
              <h2 className="title">Contribute to the Loobrary</h2>
              <p className="description">
                Please fill out all fields to offer your talent, venue, or gear.
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
            <p>We’ll contact you about your Loobrary card.</p>
            <button onClick={onExplore}>Explore Loob</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoobrarySignUp;
