// MessageCollector.js
import React, { useEffect, useState } from 'react';

const MessageCollector = ({ messages, showDashboard }) => {
  const [jsonMessages, setJsonMessages] = useState([]);

  useEffect(() => {
    if (showDashboard) {
      // Filter messages to only include those in JSON format
      const filteredJsonMessages = messages.filter(msg => {
        try {
          JSON.parse(msg.content);
          return true;
        } catch (error) {
          return false;
        }
      });
  
      // Set the JSON messages to state
      setJsonMessages(filteredJsonMessages);
    }
  }, [messages, showDashboard]);

  // Return null if not showing dashboard
  if (!showDashboard) {
    return null;
  }

  return (
    <div>
      {/* Optionally render the JSON messages */}
    </div>
  );
};

export default MessageCollector;
