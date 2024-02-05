import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Import the uuidv4 function

export type SimilarityMetric = "cosine" | "euclidean" | "dot_product";

const useConfiguration = () => {
  // Safely get values from localStorage
  const getLocalStorageValue = (key: string, defaultValue: any) => {
    if (typeof window !== 'undefined') {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        return storedValue;
      }
    }
    return defaultValue;
  };

  // Generate a UUID for the session when the component mounts
  const [uuid] = useState<string>(() => {
    const storedUuid = getLocalStorageValue('sessionUuid', ''); // Check if a UUID is already stored
    if (storedUuid) {
      return storedUuid; // Use the stored UUID if available
    }
    return uuidv4(); // Generate a new UUID if not available
  });

  const [useRag, setUseRag] = useState<boolean>(() => getLocalStorageValue('useRag', 'true') === 'true');
  const [llm, setLlm] = useState<string>(() => getLocalStorageValue('llm', 'gpt-3.5-turbo'));
  const [similarityMetric, setSimilarityMetric] = useState<SimilarityMetric>(
    () => getLocalStorageValue('similarityMetric', 'cosine') as SimilarityMetric
  );

  const setConfiguration = (rag: boolean, llm: string, similarityMetric: SimilarityMetric) => {
    setUseRag(rag);
    setLlm(llm);
    setSimilarityMetric(similarityMetric);
  }

  // Persist the UUID and other configuration values to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionUuid', uuid);
      localStorage.setItem('useRag', JSON.stringify(useRag));
      localStorage.setItem('llm', llm);
      localStorage.setItem('similarityMetric', similarityMetric);
    }
  }, [uuid, useRag, llm, similarityMetric]);

  return {
    useRag,
    llm,
    similarityMetric,
    setConfiguration,
    uuid, // Include the UUID in the returned configuration
  };
}

export default useConfiguration;
