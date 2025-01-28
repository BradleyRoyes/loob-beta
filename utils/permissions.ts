export type PermissionType = 'microphone' | 'geolocation';

export const checkPermission = async (type: PermissionType): Promise<PermissionState> => {
  // iOS Safari doesn't support the permissions API for all features
  // We'll use feature detection and fallbacks
  if ('permissions' in navigator) {
    try {
      const permission = await navigator.permissions.query({
        name: type as PermissionName
      });
      return permission.state;
    } catch (e) {
      console.debug('Permissions API not supported for', type);
    }
  }
  
  // Fallback checks
  if (type === 'microphone') {
    if (!navigator.mediaDevices?.getUserMedia) {
      return 'denied';
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return 'granted';
    } catch (e) {
      return 'denied';
    }
  }

  if (type === 'geolocation') {
    if (!navigator.geolocation) {
      return 'denied';
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve('granted'),
        () => resolve('denied'),
        { timeout: 3000 }
      );
    });
  }

  return 'prompt';
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (e) {
    return false;
  }
};

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
    return true;
  } catch (e) {
    return false;
  }
};

export const getDevicePlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  if (/android/.test(userAgent)) {
    return 'android';
  }
  return 'other';
};

export const getPermissionInstructions = (type: PermissionType): string => {
  const platform = getDevicePlatform();
  
  if (type === 'microphone') {
    if (platform === 'ios') {
      return 'To enable microphone access on iOS:\n1. Open Settings\n2. Scroll down to Safari\n3. Tap Microphone\n4. Enable for this website';
    }
    if (platform === 'android') {
      return 'To enable microphone access on Android:\n1. Tap the lock icon in your browser\'s address bar\n2. Enable microphone access';
    }
    return 'Please enable microphone access in your browser settings';
  }

  if (type === 'geolocation') {
    if (platform === 'ios') {
      return 'To enable location access on iOS:\n1. Open Settings\n2. Scroll down to Safari\n3. Tap Location\n4. Select "While Using" for this website';
    }
    if (platform === 'android') {
      return 'To enable location access on Android:\n1. Tap the lock icon in your browser\'s address bar\n2. Enable location access';
    }
    return 'Please enable location access in your browser settings';
  }

  return 'Please check your browser settings to enable permissions';
}; 