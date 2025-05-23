/**
 * Generate a unique ID for files and other purposes
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Get the device ID from localStorage or create a new one
 */
export const getOrCreateDeviceId = (): string => {
  const storageKey = 'garbage-watch-device-id';
  let deviceId = localStorage.getItem(storageKey);
  
  if (!deviceId) {
    deviceId = generateUniqueId();
    localStorage.setItem(storageKey, deviceId);
  }
  
  return deviceId;
};

/**
 * Format a date for display
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Get status color based on report status
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Pending':
      return 'text-red-600 bg-red-100';
    case 'In Progress':
      return 'text-yellow-600 bg-yellow-100';
    case 'Resolved':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

/**
 * Get pin color based on report status
 */
export const getPinColor = (status: string): string => {
  switch (status) {
    case 'Pending':
      return '#ef4444'; // red-500
    case 'In Progress':
      return '#f59e0b'; // amber-500
    case 'Resolved':
      return '#10b981'; // emerald-500
    default:
      return '#6b7280'; // gray-500
  }
}; 