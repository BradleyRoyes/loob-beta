'use client';

import React from 'react';
import './OfferingProfile.css';
import TorusSphere from './TorusSphere';
import {
  Box,
  Modal,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Card,
  CardContent,
  Chip,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';

interface Offering {
  _id: string;
  title: string;
  description: string;
  offeringType: 'venue' | 'gear' | 'talent';
  location?: string;
  pseudonym?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  createdAt: string;
  [key: string]: any; // Allow for additional dynamic fields
}

interface OfferingProfileProps {
  offering: Offering;
  onClose: () => void;
}

const OfferingProfile: React.FC<OfferingProfileProps> = ({ offering, onClose }) => {
  return (
    <Modal
      open={true}
      onClose={onClose}
      aria-labelledby="offering-profile-modal"
      className="offering-profile-overlay"
    >
      <Box className="offering-profile-modal">
        <Card sx={{ width: '100%', maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }}>
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>

          <CardContent>
            {/* Header Section */}
            <Typography variant="h4" component="h2" gutterBottom>
              {offering.title}
            </Typography>
            
            <Chip 
              label={offering.offeringType.toUpperCase()} 
              color="primary" 
              sx={{ mb: 2 }}
            />

            {/* Visual Section */}
            <Box className="visualization-section" sx={{ my: 3 }}>
              <TorusSphere loobricateId={offering._id} />
            </Box>

            {/* Description */}
            <Typography variant="body1" paragraph>
              {offering.description}
            </Typography>

            {/* Dynamic Accordion Sections */}
            <Stack spacing={1}>
              {/* Contact Information */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Contact Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {offering.pseudonym && (
                      <Typography>Pseudonym: {offering.pseudonym}</Typography>
                    )}
                    {offering.email && (
                      <Typography>Email: {offering.email}</Typography>
                    )}
                    {offering.phone && (
                      <Typography>Phone: {offering.phone}</Typography>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Location */}
              {offering.location && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Location</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>{offering.location}</Typography>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Tags */}
              {offering.tags && offering.tags.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Tags</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {offering.tags.map((tag, index) => (
                        <Chip key={index} label={tag} variant="outlined" />
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Additional Details */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Additional Details</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(offering.createdAt).toLocaleDateString()}
                  </Typography>
                  {/* Additional dynamic fields can be mapped here */}
                </AccordionDetails>
              </Accordion>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Modal>
  );
};

export default OfferingProfile;
