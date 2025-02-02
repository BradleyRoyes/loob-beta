import React from 'react';
import { Card, Text, Group, SimpleGrid, RingProgress, Stack } from '@mantine/core';

interface DatasetStatsProps {
  statistics: {
    totalImages: number;
    validImages: number;
    totalLabels: number;
    validLabels: number;
    averageWidth: number;
    averageHeight: number;
    minCoordinates: { x: number; y: number };
    maxCoordinates: { x: number; y: number };
  };
}

export function DatasetStats({ statistics }: DatasetStatsProps) {
  const imageValidityPercent = (statistics.validImages / statistics.totalImages) * 100;
  const labelValidityPercent = (statistics.validLabels / statistics.totalLabels) * 100;

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Text weight={500} size="lg" mb="md">Dataset Statistics</Text>

      <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
        <Group>
          <RingProgress
            sections={[{ value: imageValidityPercent, color: 'blue' }]}
            label={
              <Text size="xs" align="center">
                {Math.round(imageValidityPercent)}%
              </Text>
            }
          />
          <Stack spacing={0}>
            <Text size="sm">Valid Images</Text>
            <Text size="xs" color="dimmed">
              {statistics.validImages} / {statistics.totalImages} files
            </Text>
          </Stack>
        </Group>

        <Group>
          <RingProgress
            sections={[{ value: labelValidityPercent, color: 'green' }]}
            label={
              <Text size="xs" align="center">
                {Math.round(labelValidityPercent)}%
              </Text>
            }
          />
          <Stack spacing={0}>
            <Text size="sm">Valid Labels</Text>
            <Text size="xs" color="dimmed">
              {statistics.validLabels} / {statistics.totalLabels} files
            </Text>
          </Stack>
        </Group>
      </SimpleGrid>

      <SimpleGrid cols={2} mt="xl" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
        <Card withBorder p="sm">
          <Text size="sm" weight={500} mb="xs">Image Dimensions</Text>
          <Text size="xs" color="dimmed">Average Width: {Math.round(statistics.averageWidth)}px</Text>
          <Text size="xs" color="dimmed">Average Height: {Math.round(statistics.averageHeight)}px</Text>
        </Card>

        <Card withBorder p="sm">
          <Text size="sm" weight={500} mb="xs">Coordinate Ranges</Text>
          <Text size="xs" color="dimmed">
            X: {Math.round(statistics.minCoordinates.x)} to {Math.round(statistics.maxCoordinates.x)}
          </Text>
          <Text size="xs" color="dimmed">
            Y: {Math.round(statistics.minCoordinates.y)} to {Math.round(statistics.maxCoordinates.y)}
          </Text>
        </Card>
      </SimpleGrid>
    </Card>
  );
} 