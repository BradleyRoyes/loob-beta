'use client';

import React, { useEffect, useState } from 'react';

interface Loobricate {
  id: string;
  name: string;
  description: string;
  address: string;
}

const LoobricatesList: React.FC = () => {
  const [loobricates, setLoobricates] = useState<Loobricate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoobricates = async () => {
      try {
        const response = await fetch('/api/loobricates');
        if (!response.ok) {
          throw new Error('Failed to fetch loobricates');
        }
        const data = await response.json();
        setLoobricates(data);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'Failed to load loobricates');
      } finally {
        setLoading(false);
      }
    };

    fetchLoobricates();
  }, []);

  if (loading) return <div>Loading loobricates...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="loobricates-list">
      {loobricates.map(loobricate => (
        <div key={loobricate.id} className="loobricate-card">
          <h3>{loobricate.name}</h3>
          <p>{loobricate.description}</p>
          <p>{loobricate.address}</p>
        </div>
      ))}
    </div>
  );
};

export default LoobricatesList; 