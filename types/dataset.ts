export interface ValidationResult {
  isValid: boolean;
  stats: {
    totalImages: number;
    totalLabels: number;
    imageResolutions: string[];
    averageFileSize: number;
  };
  errors: Array<{
    type: 'error' | 'warning';
    message: string;
    code?: string;
    details?: any;
  }>;
  debug?: {
    paths?: any;
    dirExists?: any;
    error?: {
      message: string;
      stack?: string;
    };
  };
} 