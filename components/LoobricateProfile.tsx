'use client';

import React from 'react';
import './LoobricateProfile.css';
import TorusSphere from './TorusSphere';
import type { LoobricateData } from '../types/loobricate';

interface Props {
  loobricate: LoobricateData;
  onClose: () => void;
}

const LoobricateProfile: React.FC<Props> = ({ loobricate, onClose }) => {
  return (
    <div className="loobricate-profile">
      <div className="loobricate-header">
        <h2>{loobricate.name}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="visualization-section">
        <TorusSphere loobricateId={loobricate._id} />
      </div>

      <div className="loobricate-info">
        <p className="description">{loobricate.description}</p>
        {loobricate.addressLine1 && (
          <p className="address">
            {loobricate.addressLine1}
            {loobricate.city && <>, {loobricate.city}</>}
          </p>
        )}
        
        {loobricate.tags && loobricate.tags.length > 0 && (
          <div className="tags-display">
            {loobricate.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="stats">
          <div className="stat">
            <span className="label">Members</span>
            <span className="value">{loobricate.members.length}</span>
          </div>
          <div className="stat">
            <span className="label">Created</span>
            <span className="value">
              {new Date(loobricate.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoobricateProfile; 