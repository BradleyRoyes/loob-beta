'use client';

import React, { useState } from 'react';
import './LoobrarySignUp.css';
import { useGlobalState } from '../components/GlobalStateContext'; // Adjust path as needed

interface LoobrarySignUpProps {
  onBack: () => void; // Navigate back to the splash screen
  onExplore: () => void; // Triggered when the user wants to explore Loob
}

const LoobrarySignUp: React.FC<LoobrarySignUpProps> = ({ onBack, onExplore }) => {
  const { setUserId } = useGlobalState(); // Access global context to set the user pseudonym
  const [currentPhase, setCurrentPhase] = useState(1);
  const [formData, setFormData] = useState({
    pseudonym: '',
    email: '',
    phone: '',
    offerings: {
      title: '',
      type: '',
      description: '',
      location: '',
    },
  });

  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

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
      offerings: {
        ...prev.offerings,
        [name]: value,
      },
    }));
  };

  const handleNext = () => {
    if (currentPhase === 1 && (!formData.pseudonym || !formData.email)) {
      setError('Pseudonym and email are required.');
      return;
    }
    setError('');
    setCurrentPhase((prev) => prev + 1);
  };

  const handlePreviousPhase = () => {
    setError('');
    setCurrentPhase((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/populateDB2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmissionSuccess(true);
        setUserId(formData.pseudonym); // Set the pseudonym in global context
        setCurrentPhase(3); // Proceed to the success phase
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
                  Phone <span className="info">(If you want to join our Telegram group)</span>
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
                    value={formData.offerings.title}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>
              <div className="formGroup">
                <label htmlFor="type">
                  Type
                  <select
                    id="type"
                    name="type"
                    value={formData.offerings.type}
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
                    value={formData.offerings.description}
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
                    value={formData.offerings.location}
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
            <p>We will be in contact via email regarding how you can pick up your card.</p>
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
