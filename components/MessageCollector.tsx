import React from 'react';

const MessageCollector = ({ messages, onCollect }) => {
  const handleCollectMessages = () => {
    // Filter messages to only include those in JSON format
    const jsonMessages = messages.filter(msg => {
      if (typeof msg.content === 'string') {
        try {
          JSON.parse(msg.content);
          return true;
        } catch (error) {
          return false;
        }
      }
      return false;
    });

    // Convert JSON messages to a JSON string
    const jsonMessagesString = jsonMessages.map(msg => msg.content).join('\n');

    // Call the callback function to send JSON messages to the dashboard
    onCollect(jsonMessagesString);
  };

  return (
    <button onClick={handleCollectMessages} className="p-2 bg-blue-500 text-white rounded">
      Collect JSON Messages
    </button>
  );
};

export default MessageCollector;
