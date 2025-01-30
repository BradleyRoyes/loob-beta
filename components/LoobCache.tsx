"use client";

import React, { useEffect, useState, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Node } from './Map';

interface LoobCacheProps {
  currentLocation: [number, number] | null;
  onLoobFound: (amount: number) => void;
  mapInstance?: maplibregl.Map | null;
}

interface LoobTreasure {
  id: string;
  location: [number, number];
  amount: number;
  claimedBy?: string;
  expiresAt: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
  type: 'digital' | 'nfc';
  communityScore: number; // 0-100 representing community activity
  eventProximity: number; // 0-100 representing nearby event activity
  resourceDensity: number; // 0-100 representing nearby gear/venues
}

// Mock community hotspots (could come from your actual venues/events data)
const MOCK_HOTSPOTS: Array<{location: [number, number], weight: number}> = [
  { location: [13.405, 52.52], weight: 0.8 }, // Example: Berghain area
  { location: [13.454, 52.51], weight: 0.7 }, // Example: RAW Gelände
  { location: [13.428, 52.498], weight: 0.9 }, // Example: Club der Visionäre
];

const PLACEMENT_PARAMS = {
  MIN_DISTANCE_BETWEEN_CACHES: 100, // meters
  MAX_CACHES_PER_AREA: 5,
  DIFFICULTY_RANGES: {
    easy: { radius: 50, reward: [10, 50], weight: 0.5 },
    medium: { radius: 25, reward: [50, 200], weight: 0.3 },
    hard: { radius: 10, reward: [200, 1000], weight: 0.2 }
  },
  CACHE_LIFETIME: 24 * 60 * 60 * 1000,
  SPAWN_INTERVAL: 5 * 60 * 1000, // New treasure every 5 minutes
  MAX_ACTIVE_TREASURES: 10
};

const LoobCache: React.FC<LoobCacheProps> = ({ currentLocation, onLoobFound, mapInstance }) => {
  const [nearbyTreasures, setNearbyTreasures] = useState<LoobTreasure[]>([]);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const treasureLayerId = 'treasure-layer';

  // Simulated AI scoring function for location desirability
  const calculateLocationScore = (
    location: [number, number],
    existingCaches: LoobTreasure[],
    timeOfDay: number // 0-24
  ): number => {
    // Factor 1: Distance from existing caches (avoid clustering)
    const minDistance = Math.min(
      ...existingCaches.map(cache => 
        calculateDistance(location, cache.location)
      ),
      1000 // Max distance to consider
    );
    const distanceScore = Math.min(minDistance / PLACEMENT_PARAMS.MIN_DISTANCE_BETWEEN_CACHES, 1);

    // Factor 2: Proximity to community hotspots
    const hotspotScore = MOCK_HOTSPOTS.reduce((score, hotspot) => {
      const distance = calculateDistance(location, hotspot.location);
      return score + (hotspot.weight / (1 + distance/1000));
    }, 0) / MOCK_HOTSPOTS.length;

    // Factor 3: Time-based activity prediction
    const timeScore = Math.sin((timeOfDay - 12) * Math.PI / 12) * 0.5 + 0.5;

    // Factor 4: Random exploration factor (encourages some randomness)
    const explorationScore = Math.random() * 0.2;

    // Weighted combination of factors
    return (
      distanceScore * 0.3 +
      hotspotScore * 0.4 +
      timeScore * 0.2 +
      explorationScore * 0.1
    );
  };

  const generateTreasureLocation = async (
    existingCaches: LoobTreasure[],
  ): Promise<LoobTreasure> => {
    const timeOfDay = new Date().getHours();
    let bestLocation: [number, number] = [13.405, 52.52];
    let bestScore = -1;

    // Generate and evaluate 20 candidate locations
    for (let i = 0; i < 20; i++) {
      const candidateLocation: [number, number] = [
        13.2 + Math.random() * 0.5, // Berlin longitude range
        52.4 + Math.random() * 0.4  // Berlin latitude range
      ];

      const score = calculateLocationScore(
        candidateLocation,
        existingCaches,
        timeOfDay
      );

      if (score > bestScore) {
        bestScore = score;
        bestLocation = candidateLocation;
      }
    }

    // Determine difficulty based on location score
    let difficulty: 'easy' | 'medium' | 'hard';
    if (bestScore > 0.8) difficulty = 'hard';
    else if (bestScore > 0.5) difficulty = 'medium';
    else difficulty = 'easy';

    // Calculate reward based on difficulty and some randomness
    const range = PLACEMENT_PARAMS.DIFFICULTY_RANGES[difficulty].reward;
    const amount = Math.floor(range[0] + Math.random() * (range[1] - range[0]));

    return {
      id: `treasure-${Date.now()}-${Math.random()}`,
      location: bestLocation,
      amount,
      difficulty,
      expiresAt: new Date(Date.now() + PLACEMENT_PARAMS.CACHE_LIFETIME),
      type: Math.random() > 0.8 ? 'nfc' : 'digital',
      communityScore: bestScore * 100,
      eventProximity: Math.random() * 100,
      resourceDensity: Math.random() * 100,
      hint: generateHint(bestLocation, difficulty)
    };
  };

  // Generate cryptic hints based on location and difficulty
  const generateHint = (location: [number, number], difficulty: string): string => {
    const hints = [
      `Where the beats echo through concrete dreams...`,
      `Follow the sound of underground rhythms...`,
      `Where artists gather under neon lights...`,
      `In the shadow of Berlin's industrial past...`,
      `Where culture blooms in unexpected places...`
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  };

  // Update treasure markers on the map
  const updateTreasureMarkers = () => {
    if (!mapInstance) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers for each treasure
    nearbyTreasures.forEach(treasure => {
      const el = document.createElement('div');
      el.className = `treasure-marker ${treasure.difficulty} ${treasure.type}`;
      
      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom'
      })
      .setLngLat(treasure.location)
      .addTo(mapInstance);

      markersRef.current.push(marker);
    });
  };

  // Check if user is within range of any treasures
  const checkForNearbyTreasures = async () => {
    if (!currentLocation) return;

    const [userLon, userLat] = currentLocation;

    // Calculate distance to each treasure
    nearbyTreasures.forEach(treasure => {
      const distance = calculateDistance(
        [userLon, userLat],
        treasure.location
      );

      const difficultyRange = PLACEMENT_PARAMS.DIFFICULTY_RANGES[treasure.difficulty];

      if (distance <= difficultyRange.radius && !treasure.claimedBy) {
        // User found a treasure!
        claimTreasure(treasure);
      }
    });
  };

  // Claim a found treasure
  const claimTreasure = async (treasure: LoobTreasure) => {
    try {
      // Here you would:
      // 1. Call your backend to verify the claim
      // 2. Update the user's LOOB balance
      // 3. Mark the treasure as claimed
      // 4. Trigger any animations/celebrations

      // For now, we'll just call the callback
      onLoobFound(treasure.amount);

      // Remove the claimed treasure from nearby list
      setNearbyTreasures(prev => 
        prev.filter(t => t.id !== treasure.id)
      );

      // Trigger AI to potentially place new treasure
      const newTreasure = await generateTreasureLocation(
        nearbyTreasures
      );

      // Add new treasure to the map
      setNearbyTreasures(prev => [...prev, newTreasure]);

    } catch (error) {
      console.error('Failed to claim treasure:', error);
    }
  };

  // Utility function to calculate distance between points
  const calculateDistance = (
    point1: [number, number],
    point2: [number, number]
  ): number => {
    // Haversine formula for calculating distance
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1[1] * Math.PI/180;
    const φ2 = point2[1] * Math.PI/180;
    const Δφ = (point2[1] - point1[1]) * Math.PI/180;
    const Δλ = (point2[0] - point1[0]) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Check for nearby treasures periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkForNearbyTreasures();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [currentLocation, nearbyTreasures]);

  // Clean up expired treasures
  useEffect(() => {
    const now = new Date();
    setNearbyTreasures(prev => 
      prev.filter(treasure => treasure.expiresAt > now)
    );
  }, [lastCheck]);

  // Spawn new treasures periodically
  useEffect(() => {
    const spawnInterval = setInterval(async () => {
      if (nearbyTreasures.length < PLACEMENT_PARAMS.MAX_ACTIVE_TREASURES) {
        const newTreasure = await generateTreasureLocation(nearbyTreasures);
        setNearbyTreasures(prev => [...prev, newTreasure]);
      }
    }, PLACEMENT_PARAMS.SPAWN_INTERVAL);

    return () => clearInterval(spawnInterval);
  }, [nearbyTreasures]);

  // Update markers whenever treasures change
  useEffect(() => {
    updateTreasureMarkers();
  }, [nearbyTreasures, mapInstance]);

  return null; // This component doesn't render anything
};

export default LoobCache; 