'use client';

import React, { useState } from 'react';
import './LoobrarySignUp.css';

interface LoobrarySignUpProps {
  onBack: () => void; // This will navigate to the splash screen
}

const LoobrarySignUp: React.FC<LoobrarySignUpProps> = ({ onBack }) => {
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
    setCurrentPhase((prev) => prev - 1);
  };

  return (
    <div className="signupScreen">
      {/* Back arrow always goes to the splash screen */}
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
                <label>
                  Pseudonym <span className="info">(To remember you)</span>
                </label>
                <input
                  type="text"
                  name="pseudonym"
                  placeholder="Enter your pseudonym"
                  value={formData.pseudonym}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, pseudonym: e.target.value }))
                  }
                />
              </div>
              <div className="formGroup">
                <label>
                  Email <span className="info">(To contact you about your card)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="formGroup">
                <label>
                  Phone <span className="info">(If you want to join our Telegram group)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
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
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter a title"
                  value={formData.offerings.title}
                  onChange={handleInputChange}
                />
              </div>
              <div className="formGroup">
                <label>Type</label>
                <select
                  name="type"
                  value={formData.offerings.type}
                  onChange={handleInputChange}
                >
                  <option value="">Select type</option>
                  <option value="venue">Venue</option>
                  <option value="talent">Talent</option>
                  <option value="gear">Gear</option>
                </select>
              </div>
              <div className="formGroup">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Provide a description"
                  value={formData.offerings.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="formGroup">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Enter a location"
                  value={formData.offerings.location}
                  onChange={handleInputChange}
                />
              </div>
              <div className="buttonGroup">
                <button type="button" onClick={handlePreviousPhase}>
                  Back
                </button>
                <button type="button" onClick={handleNext}>
                  Submit
                </button>
              </div>
            </form>
          </>
        )}

        {currentPhase === 3 && (
          <div className="finalPhase">
            <h2>Thanks for joining!</h2>
            <p>
              We&apos;ll be in contact with you via email about picking up your Loobrary card.
            </p>
            <p>You can now use your pseudonym to explore Loob.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoobrarySignUp;
