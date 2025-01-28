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
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import NfcIcon from '@mui/icons-material/Nfc';

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
  loobricates?: string[];
  dataType?: string;
  createdAt: string;
  status?: 'available' | 'checked_out' | 'maintenance' | 'reserved';
  lastCheckedOut?: string;
  lastCheckedIn?: string;
  currentHolder?: string;
  [key: string]: any; // Allow for additional dynamic fields
}

interface OfferingProfileProps {
  offering: Offering;
  onClose: () => void;
}

const OfferingProfile: React.FC<OfferingProfileProps> = ({ offering, onClose }) => {
  // Helper function to get status color and text
  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'available':
        return { color: '#4caf50', text: 'Available', severity: 'success' as const };
      case 'checked_out':
        return { color: '#ff9800', text: 'Checked Out', severity: 'warning' as const };
      case 'maintenance':
        return { color: '#f44336', text: 'Under Maintenance', severity: 'error' as const };
      case 'reserved':
        return { color: '#2196f3', text: 'Reserved', severity: 'info' as const };
      default:
        return { color: '#757575', text: 'Status Unknown', severity: 'info' as const };
    }
  };

  const statusInfo = getStatusInfo(offering.status);

  return (
    <Modal
      open={true}
      onClose={onClose}
      aria-labelledby="offering-profile-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }
      }}
    >
      <Box sx={{ outline: 'none', width: '100%', maxWidth: 800, maxHeight: '90vh', m: 2 }}>
        <Card sx={{ 
          backgroundColor: 'var(--background-secondary, #232323)',
          color: 'var(--text-primary, #ffffff)',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 2,
          boxShadow: 'var(--shadow-primary)',
          '& .MuiCardContent-root': {
            padding: 3
          }
        }}>
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'var(--text-secondary, #a6aaae)',
              '&:hover': {
                color: 'var(--text-primary, #ffffff)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          <CardContent>
            {/* Header Section */}
            <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'var(--text-primary, #ffffff)', fontWeight: 600, mb: 2 }}>
              {offering.title}
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip 
                label={offering.offeringType.toUpperCase()} 
                color="primary" 
                sx={{ 
                  background: 'var(--gradient-primary)',
                  color: 'var(--text-primary, #ffffff)',
                  fontWeight: 500
                }}
              />
              <Chip 
                icon={<NfcIcon />}
                label={statusInfo.text}
                sx={{ 
                  backgroundColor: `${statusInfo.color}20`,
                  color: statusInfo.color,
                  fontWeight: 500,
                  '& .MuiChip-icon': {
                    color: statusInfo.color
                  }
                }}
              />
            </Stack>

            {/* Library Status Alert */}
            <Alert 
              severity={statusInfo.severity}
              sx={{ 
                mb: 2,
                backgroundColor: `${statusInfo.color}10`,
                color: statusInfo.color,
                border: `1px solid ${statusInfo.color}30`,
                '& .MuiAlert-icon': {
                  color: statusInfo.color
                }
              }}
            >
              {offering.status === 'checked_out' && offering.currentHolder ? 
                `Currently checked out to: ${offering.currentHolder}` :
                statusInfo.text}
              {offering.lastCheckedIn && offering.status === 'available' && 
                ` - Last returned: ${new Date(offering.lastCheckedIn).toLocaleDateString()}`}
            </Alert>

            {/* Visual Section */}
            <Box className="visualization-section" sx={{ my: 3 }}>
              <TorusSphere loobricateId={offering._id} />
            </Box>

            {/* Description */}
            <Typography variant="body1" paragraph sx={{ color: 'var(--text-secondary, #a6aaae)', mb: 3 }}>
              {offering.description}
            </Typography>

            {/* Dynamic Accordion Sections */}
            <Stack spacing={1}>
              {/* Contact Information */}
              <Accordion 
                defaultExpanded
                sx={{ 
                  backgroundColor: 'var(--background-soft, #1e1e1e)',
                  color: 'var(--text-primary, #ffffff)',
                  '&:before': { display: 'none' },
                  '& .MuiAccordionSummary-root': {
                    borderBottom: '1px solid var(--border-primary, #3a3a3a)'
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-secondary, #a6aaae)' }} />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      color: 'var(--text-primary, #ffffff)'
                    }
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }}>Contact Information</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    {offering.pseudonym && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PersonIcon sx={{ color: 'var(--text-secondary, #a6aaae)' }} />
                        <Typography sx={{ color: 'var(--text-secondary, #a6aaae)' }}>
                          {offering.pseudonym}
                        </Typography>
                      </Stack>
                    )}
                    {offering.email && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailIcon sx={{ color: 'var(--text-secondary, #a6aaae)' }} />
                        <Typography 
                          component="a" 
                          href={`mailto:${offering.email}`}
                          sx={{ 
                            color: 'var(--text-secondary, #a6aaae)',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {offering.email}
                        </Typography>
                      </Stack>
                    )}
                    {offering.phone && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneIcon sx={{ color: 'var(--text-secondary, #a6aaae)' }} />
                        <Typography 
                          component="a" 
                          href={`tel:${offering.phone}`}
                          sx={{ 
                            color: 'var(--text-secondary, #a6aaae)',
                            textDecoration: 'none',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {offering.phone}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </AccordionDetails>
              </Accordion>

              {/* Location */}
              {offering.location && (
                <Accordion 
                  sx={{ 
                    backgroundColor: 'var(--background-soft, #1e1e1e)',
                    color: 'var(--text-primary, #ffffff)',
                    '&:before': { display: 'none' },
                    '& .MuiAccordionSummary-root': {
                      borderBottom: '1px solid var(--border-primary, #3a3a3a)'
                    }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-secondary, #a6aaae)' }} />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        color: 'var(--text-primary, #ffffff)'
                      }
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocationOnIcon sx={{ color: 'var(--text-secondary, #a6aaae)' }} />
                      <Typography sx={{ fontWeight: 500 }}>Location</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2 }}>
                    <Typography sx={{ color: 'var(--text-secondary, #a6aaae)' }}>
                      {offering.location}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Connected Loobricates */}
              {offering.loobricates && offering.loobricates.length > 0 && (
                <Accordion 
                  sx={{ 
                    backgroundColor: 'var(--background-soft, #1e1e1e)',
                    color: 'var(--text-primary, #ffffff)',
                    '&:before': { display: 'none' },
                    '& .MuiAccordionSummary-root': {
                      borderBottom: '1px solid var(--border-primary, #3a3a3a)'
                    }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-secondary, #a6aaae)' }} />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        color: 'var(--text-primary, #ffffff)'
                      }
                    }}
                  >
                    <Typography sx={{ fontWeight: 500 }}>Connected Loobricates</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {offering.loobricates.map((loobricate, index) => (
                        <Chip 
                          key={index} 
                          label={loobricate}
                          sx={{ 
                            background: 'var(--gradient-user)',
                            color: 'var(--text-primary, #ffffff)',
                          }}
                        />
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Tags */}
              {offering.tags && offering.tags.length > 0 && (
                <Accordion 
                  sx={{ 
                    backgroundColor: 'var(--background-soft, #1e1e1e)',
                    color: 'var(--text-primary, #ffffff)',
                    '&:before': { display: 'none' },
                    '& .MuiAccordionSummary-root': {
                      borderBottom: '1px solid var(--border-primary, #3a3a3a)'
                    }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-secondary, #a6aaae)' }} />}
                    sx={{
                      '& .MuiAccordionSummary-content': {
                        color: 'var(--text-primary, #ffffff)'
                      }
                    }}
                  >
                    <Typography sx={{ fontWeight: 500 }}>Tags</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {offering.tags.map((tag, index) => (
                        <Chip 
                          key={index} 
                          label={tag} 
                          variant="outlined" 
                          sx={{ 
                            color: 'var(--text-secondary, #a6aaae)',
                            borderColor: 'var(--border-primary, #3a3a3a)'
                          }}
                        />
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Library Details */}
              <Accordion 
                defaultExpanded
                sx={{ 
                  backgroundColor: 'var(--background-soft, #1e1e1e)',
                  color: 'var(--text-primary, #ffffff)',
                  '&:before': { display: 'none' },
                  '& .MuiAccordionSummary-root': {
                    borderBottom: '1px solid var(--border-primary, #3a3a3a)'
                  }
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ color: 'var(--text-secondary, #a6aaae)' }} />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      color: 'var(--text-primary, #ffffff)'
                    }
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }}>Library Details</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2 }}>
                  <Stack spacing={1}>
                    <Typography sx={{ color: 'var(--text-secondary, #a6aaae)' }}>
                      Added to Loobrary: {new Date(offering.createdAt).toLocaleDateString()}
                    </Typography>
                    {offering.lastCheckedOut && (
                      <Typography sx={{ color: 'var(--text-secondary, #a6aaae)' }}>
                        Last Checked Out: {new Date(offering.lastCheckedOut).toLocaleDateString()}
                      </Typography>
                    )}
                    {offering.lastCheckedIn && (
                      <Typography sx={{ color: 'var(--text-secondary, #a6aaae)' }}>
                        Last Returned: {new Date(offering.lastCheckedIn).toLocaleDateString()}
                      </Typography>
                    )}
                  </Stack>
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
