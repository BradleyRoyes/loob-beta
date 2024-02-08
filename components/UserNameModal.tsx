// Filename: UsernameModal.tsx
import React, { useState } from 'react';

interface UsernameModalProps {
  onSaveUsername: (username: string) => void;
}

const UsernameModal: React.FC<UsernameModalProps> = ({ onSaveUsername }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username) {
      onSaveUsername(username);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg">
        <label htmlFor="username" className="block mb-2 text-xl font-bold">
          Enter your name:
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 mb-4 w-full"
          autoFocus
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded-lg">
          Submit
        </button>
      </form>
    </div>
  );
};

export default UsernameModal;
