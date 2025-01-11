// components/ConfigureModal.jsx

import React from 'react';
import Configure from './Configure';

export default function ConfigureModal({ onClose }) {
  return (
    <Configure
      isOpen={true}
      onClose={onClose}
      useRag={true}
      llm="gpt-3.5-turbo"
      similarityMetric="cosine"
      setConfiguration={(rag, llm, similarityMetric) => {
        console.log('Configuration Updated:', { rag, llm, similarityMetric });
      }}
    />
  );
}
