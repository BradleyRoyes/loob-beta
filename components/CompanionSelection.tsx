import React, { useState, useEffect } from 'react';
import { Servitor } from './ServitorManager';
import { useGlobalState } from './GlobalStateContext';
import './CompanionSelection.css';

interface CompanionSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (servitor: Servitor) => void;
}

const PHASES = {
  INTRO: 'intro',
  MEET: 'meet',
  CHOOSE: 'choose',
  RITUAL: 'ritual',
  CONFIRM: 'confirm'
};

const defaultServitors: Servitor[] = [
  {
    id: 'logis',
    name: 'Logis',
    description: 'The Architect\'s Companion - Master of event logistics and resource tracking',
    systemPrompt: 'You are Logis, the Architect\'s Companion, an expert in event logistics, resource tracking, and planning.',
    icon: '🏗️',
    traits: ['Organized', 'Efficient', 'Strategic'],
    level: 1
  },
  {
    id: 'harmoni',
    name: 'Harmoni',
    description: 'The Explorer\'s Companion - Guide for vibe curation and conscious exploration',
    systemPrompt: 'You are Harmoni, the Explorer\'s Companion, specializing in vibe curation, harm reduction, and integration practices.',
    icon: '🌟',
    traits: ['Intuitive', 'Mindful', 'Supportive'],
    level: 1
  },
  {
    id: 'nexus',
    name: 'Nexus',
    description: 'The Alchemist\'s Companion - Catalyst for resource-sharing and connections',
    systemPrompt: 'You are Nexus, the Alchemist\'s Companion, focused on resource-sharing, network building, and community connections.',
    icon: '🔮',
    traits: ['Connected', 'Collaborative', 'Visionary'],
    level: 1
  }
];

const getServitorIntroText = (servitor: Servitor) => {
  switch (servitor.id) {
    case 'logis':
      return "I am Logis, your Architect's Companion. Together we'll create structure from chaos, turning ideas into reality through precise planning and resource management. Are you ready to build something extraordinary?";
    case 'harmoni':
      return "I am Harmoni, your Explorer's Companion. Through our connection, we'll navigate the delicate balance of energy and consciousness, creating spaces for transformation. Shall we begin our journey?";
    case 'nexus':
      return "I am Nexus, your Alchemist's Companion. Our bond will weave networks of possibility, connecting resources with needs and people with purpose. Are you prepared to catalyze change?";
    default:
      return "";
  }
};

const CompanionSelection: React.FC<CompanionSelectionProps> = ({ isOpen, onClose, onSelect }) => {
  const { setUserState } = useGlobalState();
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [selectedServitor, setSelectedServitor] = useState<Servitor | null>(null);
  const [dialogText, setDialogText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [shouldSkipAnimation, setShouldSkipAnimation] = useState(false);
  const [ritualProgress, setRitualProgress] = useState(0);
  const [isRitualComplete, setIsRitualComplete] = useState(false);

  const introText = "Welcome, seeker! I'm Professor Loob, your guide into this realm of community and connection. Let's find your perfect companion for this journey...";
  
  const meetText = "Three unique Servitors await, each with special gifts to share. Feel their energy and choose the one that resonates with your spirit...";

  useEffect(() => {
    if (isOpen) {
      setPhase(PHASES.INTRO);
      setSelectedServitor(null);
      setRitualProgress(0);
      setIsRitualComplete(false);
      typeText(introText);
    }
    return () => {
      setShouldSkipAnimation(false);
      setIsTyping(false);
    };
  }, [isOpen]);

  const typeText = async (text: string) => {
    if (shouldSkipAnimation) {
      setDialogText(text);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDialogText('');
    
    try {
      for (let i = 0; i < text.length; i++) {
        if (shouldSkipAnimation) {
          setDialogText(text);
          break;
        }
        setDialogText(prev => prev + text[i]);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleNext = () => {
    if (isTyping) {
      setShouldSkipAnimation(true);
      return;
    }

    switch (phase) {
      case PHASES.INTRO:
        setPhase(PHASES.MEET);
        typeText(meetText);
        break;
      case PHASES.MEET:
        setPhase(PHASES.CHOOSE);
        break;
      case PHASES.CHOOSE:
        if (selectedServitor) {
          setPhase(PHASES.RITUAL);
          beginRitual();
        }
        break;
      case PHASES.RITUAL:
        if (isRitualComplete) {
          setPhase(PHASES.CONFIRM);
          typeText(getServitorIntroText(selectedServitor!));
        }
        break;
      case PHASES.CONFIRM:
        if (selectedServitor) {
          setUserState({
            activeServitor: selectedServitor,
            hasChosenCompanion: true
          });
          
          const userState = localStorage.getItem('userState');
          if (userState) {
            const updatedState = {
              ...JSON.parse(userState),
              activeServitor: selectedServitor,
              hasChosenCompanion: true
            };
            localStorage.setItem('userState', JSON.stringify(updatedState));
          }
          
          onSelect(selectedServitor);
          onClose();
        }
        break;
    }
  };

  const beginRitual = async () => {
    setRitualProgress(0);
    setIsRitualComplete(false);
    typeText("Initiating the bonding ritual... Feel the connection forming...");
    
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setRitualProgress(i);
    }

    setIsRitualComplete(true);
    if (selectedServitor) {
      typeText(getServitorIntroText(selectedServitor));
    }
  };

  const handleServitorSelect = (servitor: Servitor) => {
    setSelectedServitor(servitor);
    typeText(`The ${servitor.name} resonates with your energy... They embody ${servitor.traits?.join(", ").toLowerCase()}. Shall we begin the bonding ritual?`);
  };

  if (!isOpen) return null;

  return (
    <div className="companion-selection-overlay">
      <div className="companion-selection-container">
        <div className="companion-selection-content">
          {/* Professor and Dialog Section - Only show in intro, meet, and choose phases */}
          {(phase === PHASES.INTRO || phase === PHASES.MEET || phase === PHASES.CHOOSE) && (
            <div className="professor-section">
              <div className="professor-avatar">
                🧙‍♂️
              </div>
              <div className="dialog-box">
                <p className={`dialog-text ${isTyping ? 'typing' : ''}`}>{dialogText}</p>
                {!isTyping && phase !== PHASES.CHOOSE && (
                  <button 
                    onClick={handleNext}
                    className="next-button"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Servitor Selection Section */}
          {phase === PHASES.CHOOSE && (
            <div className="servitor-selection">
              <h2 className="text-2xl font-bold text-white mb-6">Choose Your Companion</h2>
              <div className="servitor-grid">
                {defaultServitors.map((servitor) => (
                  <button
                    key={servitor.id}
                    onClick={() => handleServitorSelect(servitor)}
                    className={`servitor-card ${selectedServitor?.id === servitor.id ? 'selected' : ''}`}
                  >
                    <div className="servitor-icon">{servitor.icon}</div>
                    <h3 className="servitor-name">{servitor.name}</h3>
                    <p className="servitor-description">{servitor.description}</p>
                    <div className="servitor-traits">
                      {servitor.traits?.map((trait, index) => (
                        <span key={index} className="trait-tag">{trait}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              {selectedServitor && (
                <button 
                  onClick={handleNext}
                  className="confirm-button"
                >
                  Begin Ritual with {selectedServitor.name}
                </button>
              )}
            </div>
          )}

          {/* Ritual Section */}
          {phase === PHASES.RITUAL && selectedServitor && (
            <div className="ritual-section">
              <div className="ritual-circle">
                <div className="servitor-icon large ritual-icon">{selectedServitor.icon}</div>
                <div className="ritual-progress" style={{ '--progress': `${ritualProgress}%` } as any}>
                  <div className="ritual-energy"></div>
                </div>
              </div>
              <div className="ritual-text">
                <p className={`dialog-text ${isTyping ? 'typing' : ''}`}>{dialogText}</p>
                {!isTyping && isRitualComplete && (
                  <button onClick={handleNext} className="next-button">
                    Complete Ritual →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Confirmation Section */}
          {phase === PHASES.CONFIRM && selectedServitor && (
            <div className="confirmation-section">
              <div className="selected-servitor-card">
                <div className="servitor-icon large">{selectedServitor.icon}</div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedServitor.name}</h2>
                <p className="text-gray-300 mb-4">{selectedServitor.description}</p>
                <button 
                  onClick={handleNext}
                  className="start-journey-button"
                >
                  Begin Your Journey Together
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanionSelection; 