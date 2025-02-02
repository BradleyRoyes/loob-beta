import React, { useCallback, useState } from 'react';
import { Group, Text, useMantineTheme, rem } from '@mantine/core';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';
import { Dropzone, FileWithPath } from '@mantine/dropzone';

interface DatasetUploadProps {
  onUpload: (files: { images: File[], labels: File[] }) => Promise<void>;
}

export function DatasetUpload({ onUpload }: DatasetUploadProps) {
  const theme = useMantineTheme();
  const [uploading, setUploading] = useState(false);

  const handleDrop = useCallback(async (files: FileWithPath[]) => {
    const images = files.filter(file => file.name.endsWith('.jpg'));
    const labels = files.filter(file => file.name.endsWith('.txt'));

    if (images.length === 0 && labels.length === 0) {
      return;
    }

    setUploading(true);
    try {
      await onUpload({ images, labels });
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  return (
    <Dropzone
      onDrop={handleDrop}
      onReject={(files) => console.log('rejected files', files)}
      maxSize={5 * 1024 ** 2}
      accept={['image/jpeg', 'text/plain']}
      loading={uploading}
    >
      <Group position="center" spacing="xl" style={{ minHeight: rem(220), pointerEvents: 'none' }}>
        <Dropzone.Accept>
          <IconUpload
            size="3.2rem"
            stroke={1.5}
            color={theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]}
          />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX
            size="3.2rem"
            stroke={1.5}
            color={theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]}
          />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconPhoto size="3.2rem" stroke={1.5} />
        </Dropzone.Idle>

        <div>
          <Text size="xl" inline>
            Drag dataset files here or click to select
          </Text>
          <Text size="sm" color="dimmed" inline mt={7}>
            Upload your dataset images (.jpg) and label files (.txt)
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
} 