import React, { useState } from 'react';
import { useUsername } from '../contexts/UsernameContext'; // Adjust the path as necessary

const UsernameModal: React.FC = () => {
  const { saveUsername } = useUsername();
  const [localUsername, setLocalUsername] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (localUsername.trim()) {
      saveUsername(localUsername);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '20px', borderRadius: '5px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '10px' }}>Enter your name:</label>
          <input
            type="text"
            id="username"
            value={localUsername}
            onChange={(e) => setLocalUsername(e.target.value)}
            style={{ padding: '10px', width: '100%' }}
            autoFocus
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>Submit</button>
      </form>
    </div>
  );
};

export default UsernameModal;
