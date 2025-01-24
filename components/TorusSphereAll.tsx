import React from 'react';
import TorusSphere from './TorusSphere';

interface TorusSphereAllProps {
  loobricate_id: string;
}

const TorusSphereAll = ({ loobricate_id }: TorusSphereAllProps) => {
  // For now, we'll just pass through to TorusSphere
  // In future, you might want to add all-time specific visualization logic
  return <TorusSphere loobricate_id={loobricate_id} />;
};

export default TorusSphereAll; 