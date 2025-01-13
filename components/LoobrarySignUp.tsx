'use client';

import React, { useState } from 'react';
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
    <div className="signupScreen flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white px-4">
      <button
        type="button"
        className={`topBackButton absolute top-4 left-4 text-xl font-bold transition ${
          currentPhase === 3 ? 'text-2xl' : ''
        }`}
        onClick={onBack}
      >
        ←
      </button>

      <div className="formContainer w-full max-w-md bg-gray-800 rounded-lg shadow-md p-6">
        {currentPhase === 1 && (
          <>
            <h2 className="title text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400 mb-4">
              Get your Loobrary card
            </h2>
            <p className="description text-center text-sm text-gray-400 mb-6">
              Join the Loobrary beta! During this phase, we ask everyone to offer something to the
              Loobrary. This helps build a strong community.
            </p>
            <form className="form flex flex-col gap-4">
              <input
                type="text"
                name="pseudonym"
                placeholder="Enter your pseudonym"
                value={formData.pseudonym}
                onChange={handleInputChange}
                required
                className="inputField"
              />
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="inputField"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Enter your phone number (optional)"
                value={formData.phone}
                onChange={handleInputChange}
                className="inputField"
              />
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="inputField"
              />

              {error && <p className="error text-red-400 text-sm">{error}</p>}
              <button
                type="button"
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold py-3 rounded-md hover:from-orange-400 hover:to-pink-500 transition"
              >
                Next
              </button>
            </form>
          </>
        )}

        {currentPhase === 2 && (
          <>
            <h2 className="title text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400 mb-4">
              Contribute to the Loobrary
            </h2>
            <p className="description text-center text-sm text-gray-400 mb-6">
              Please fill out all fields to offer your talent, venue, or gear.
            </p>
            <form className="form flex flex-col gap-4">
              <input
                type="text"
                name="title"
                placeholder="Enter a title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="inputField"
              />
              <select
                name="offeringType"
                value={formData.offeringType}
                onChange={handleInputChange}
                required
                className="inputField"
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
                className="inputField"
              />
              <input
                type="text"
                name="location"
                placeholder="Enter a location"
                value={formData.location}
                onChange={handleInputChange}
                required
                className="inputField"
              />

              {error && <p className="error text-red-400 text-sm">{error}</p>}
              <div className="buttonGroup flex justify-between">
                <button
                  type="button"
                  onClick={handlePreviousPhase}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold px-4 py-2 rounded-md hover:from-orange-400 hover:to-pink-500 transition"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </>
        )}

        {currentPhase === 3 && submissionSuccess && (
          <div className="finalPhase text-center">
            <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-400">
              Thanks for signing up!
            </h2>
            <p className="text-sm text-gray-400 mb-4">We’ll contact you about your Loobrary card.</p>
            <button
              onClick={onExplore}
              className="bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold py-2 px-4 rounded-md hover:from-orange-400 hover:to-pink-500 transition"
            >
              Explore Loob
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoobrarySignUp;
