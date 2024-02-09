import React, { useEffect } from 'react';

// Assuming you're using TypeScript, if not, you can remove the interface definition
interface MessageCollectorProps {
  messages: any[]; // Adjust according to the actual structure of your messages
  showDashboard: boolean;
  setCollectedJsonMessages: (messages: any[]) => void; // Adjust the function type as needed
}

const MessageCollector: React.FC<MessageCollectorProps> = ({
  messages,
  showDashboard,
  setCollectedJsonMessages,
}) => {

  useEffect(() => {
    if (showDashboard) {
      // Filter messages to only include those in JSON format and map to extract the content
      const filteredJsonMessages = messages.filter(msg => {
        try {
          JSON.parse(msg.content);
          return true;
        } catch (error) {
          return false;
        }
      }).map(msg => JSON.parse(msg.content));
  
      // Pass the JSON messages back up to the parent component
      setCollectedJsonMessages(filteredJsonMessages);
    }
  }, [messages, showDashboard, setCollectedJsonMessages]);

  // Component does not render anything itself
  return null;
};

export default MessageCollector;
