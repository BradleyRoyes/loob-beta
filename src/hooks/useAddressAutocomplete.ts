import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';

interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface UseAddressAutocompleteProps {
  onSelect?: (address: { 
    formatted: string; 
    lat: number; 
    lon: number; 
  }) => void;
}

export const useAddressAutocomplete = ({ onSelect }: UseAddressAutocompleteProps = {}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatAddress = useCallback((result: AddressResult) => {
    const { address } = result;
    const parts = [];

    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }

    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postcode) parts.push(address.postcode);
    if (address.country) parts.push(address.country);

    return parts.join(', ');
  }, []);

  const searchAddress = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || query.length < 3) {
        setSuggestions([]);
        return;
      }

      try {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search`,
          {
            params: {
              q: query,
              format: 'json',
              addressdetails: 1,
              limit: 5,
              countrycodes: 'de',
            },
            headers: {
              'Accept-Language': 'de',
              'User-Agent': 'Loob App (https://loob.com)',
            },
            signal: abortControllerRef.current.signal,
          }
        );

        setSuggestions(response.data);
        setIsOpen(true);
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError('Failed to fetch address suggestions');
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    searchAddress(value);
  };

  const handleSelectSuggestion = (suggestion: AddressResult) => {
    const formatted = formatAddress(suggestion);
    setInputValue(formatted);
    setSuggestions([]);
    setIsOpen(false);

    if (onSelect) {
      onSelect({
        formatted,
        lat: parseFloat(suggestion.lat),
        lon: parseFloat(suggestion.lon),
      });
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return {
    inputValue,
    suggestions: isOpen ? suggestions : [],
    loading,
    error,
    containerRef,
    handleInputChange,
    handleSelectSuggestion,
    setInputValue,
  };
}; 