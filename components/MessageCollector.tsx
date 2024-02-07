// MessageCollector.js
import React from 'react';

const MessageCollector = ({ messages, onCollect }) => {
  const handleCollectMessages = () => {
    // Concatenate all messages into a single string or prepare them as needed
    const concatenatedMessages = messages.map(msg => msg.content).join('\n');
    // Call an optional callback function to use the concatenated messages outside this component
    onCollect(concatenatedMessages);
  };

  return (
    <button onClick={handleCollectMessages} className="p-2 bg-blue-500 text-white rounded">
      Collect Messages
    </button>
  );
};

export default MessageCollector;
