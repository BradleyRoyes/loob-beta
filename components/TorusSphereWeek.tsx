import React from 'react';
import TorusSphere from './TorusSphere';

interface TorusSphereWeekProps {
  loobricate_id: string;
}

const TorusSphereWeek = ({ loobricate_id }: TorusSphereWeekProps) => {
  // For now, we'll just pass through to TorusSphere
  // In future, you might want to add week-specific visualization logic
  return <TorusSphere loobricate_id={loobricate_id} />;
};

export default TorusSphereWeek; 