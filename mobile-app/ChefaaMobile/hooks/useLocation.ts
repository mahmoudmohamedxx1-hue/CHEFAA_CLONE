import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationHookReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<LocationData | null>;
  requestPermission: () => Promise<boolean>;
  hasPermission: boolean;
}

export function useLocation(): LocationHookReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking location permission:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      
      if (!granted) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to use delivery features and find nearby pharmacies.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() },
          ]
        );
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setError('Failed to request location permission');
      return false;
    }
  };

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if permission is granted
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return null;
        }
      }

      // Get current position
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = locationResult.coords;

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const address = reverseGeocode[0]
        ? `${reverseGeocode[0].name || ''}, ${reverseGeocode[0].city || ''}, ${reverseGeocode[0].region || ''}, ${reverseGeocode[0].country || ''}`.trim()
        : undefined;

      const locationData: LocationData = {
        latitude,
        longitude,
        address,
      };

      setLocation(locationData);
      return locationData;
    } catch (error: any) {
      console.error('Error getting location:', error);
      let errorMessage = 'Failed to get current location';
      
      if (error.code === 'E_UNAUTHORIZED') {
        errorMessage = 'Location permission denied';
      } else if (error.code === 'E_NO_DEVICES') {
        errorMessage = 'No location devices available';
      }
      
      setError(errorMessage);
      Alert.alert('Location Error', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission]);

  const getAddressFromCoordinates = useCallback(async (
    latitude: number,
    longitude: number
  ): Promise<string | null> => {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const address = reverseGeocode[0];
      if (address) {
        return `${address.name || ''}, ${address.city || ''}, ${address.region || ''}, ${address.country || ''}`.trim();
      }
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }, []);

  const getDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 100) / 100;
  }, []);

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  return {
    location,
    isLoading,
    error,
    getCurrentLocation,
    requestPermission,
    hasPermission,
    getAddressFromCoordinates,
    getDistance,
  };
}