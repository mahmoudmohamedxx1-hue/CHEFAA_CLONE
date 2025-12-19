import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/auth/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#2563EB', '#1D4ED8', '#1E40AF']}
        style={styles.container}
      >
        <StatusBar style="light" />
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Chefaa</Text>
            <Text style={styles.subtitle}>Your Health, Simplified</Text>
          </View>
          <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
          <Text style={styles.loadingText}>Loading your health companion...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#2563EB', '#1D4ED8', '#1E40AF']}
      style={styles.container}
    >
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Chefaa</Text>
          <Text style={styles.subtitle}>Your Health, Simplified</Text>
        </View>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E7FF',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#E0E7FF',
    fontFamily: 'Poppins-Regular',
  },
});