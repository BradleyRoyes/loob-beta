import React from 'react';
import { Progress, Card, Text, Group, Badge } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

interface DatasetProgressProps {
  totalFiles: number;
  loadedFiles: number;
  errors: Array<{
    frameId: string;
    error: string;
  }>;
  status: 'loading' | 'complete' | 'error';
}

export function DatasetProgress({
  totalFiles,
  loadedFiles,
  errors,
  status
}: DatasetProgressProps) {
  const progress = (loadedFiles / totalFiles) * 100;

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group position="apart" mb="xs">
        <Text weight={500}>Dataset Loading Progress</Text>
        <Badge 
          color={status === 'complete' ? 'green' : status === 'error' ? 'red' : 'blue'}
          variant="light"
        >
          {status === 'complete' ? 'Complete' : status === 'error' ? 'Error' : 'Loading'}
        </Badge>
      </Group>

      <Progress 
        value={progress} 
        label={`${Math.round(progress)}%`}
        size="xl" 
        radius="xl" 
        color={status === 'error' ? 'red' : 'blue'}
        mb="md"
      />

      <Group position="apart" mb="xs">
        <Text size="sm" color="dimmed">Files Processed</Text>
        <Text size="sm" weight={500}>{loadedFiles} / {totalFiles}</Text>
      </Group>

      {errors.length > 0 && (
        <div>
          <Text size="sm" color="red" weight={500} mt="md">
            Errors ({errors.length}):
          </Text>
          <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
            {errors.map((error, index) => (
              <Text key={index} size="xs" color="red" mt="xs">
                Frame {error.frameId}: {error.error}
              </Text>
            ))}
          </div>
        </div>
      )}

      {status === 'complete' && errors.length === 0 && (
        <Group spacing="xs" mt="md">
          <IconCheck size={16} color="green" />
          <Text size="sm" color="green">Dataset loaded successfully</Text>
        </Group>
      )}
    </Card>
  );
} 