// components/LoobraryOfferings.tsx

'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; // Optional for animations
import './SplashScreen.css'; // Reuse SplashScreen styles

interface Signup {
  id: string;
  pseudonym: string;
  email: string;
  phone: string;
  interests: string;
  offerings: string;
  createdAt: string;
}

interface LoobraryOfferingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoobraryOfferingsModal: React.FC<LoobraryOfferingsModalProps> = ({ isOpen, onClose }) => {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchSignups();
    }
  }, [isOpen]);

  const fetchSignups = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/loobrary-signup');
      if (response.status === 200) {
        setSignups(response.data);
      }
    } catch (err) {
      console.error('Error fetching signups:', err);
      setError('Failed to load offerings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              backgroundColor: '#fff',
              padding: '2rem',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative',
              color: '#000', // Ensure text is visible on white background
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
              aria-label="Close Offerings Modal"
            >
              &times;
            </button>
            <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Loobrary Offerings</h2>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p style={{ color: 'red' }}>{error}</p>
            ) : signups.length === 0 ? (
              <p>No offerings yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {signups.map((signup) => (
                  <li
                    key={signup.id}
                    style={{
                      borderBottom: '1px solid #ccc',
                      padding: '1rem 0',
                    }}
                  >
                    <h3 style={{ marginBottom: '0.5rem' }}>{signup.pseudonym}</h3>
                    <p><strong>Interests:</strong> {signup.interests}</p>
                    <p><strong>Offerings:</strong> {signup.offerings}</p>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>
                      Joined on: {new Date(signup.createdAt).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoobraryOfferingsModal;
