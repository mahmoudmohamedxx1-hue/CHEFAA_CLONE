import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { addNotification, markAsRead } from '@/store/slices/notificationSlice';
import { supabase } from '@/lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextType {
  expoPushToken: string | null;
  notification: any;
  registerForPushNotificationsAsync: () => Promise<string | null>;
  scheduleLocalNotification: (title: string, body: string, data?: any) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const dispatch = useDispatch();
  const [expoPushToken, setExpoPushToken] = React.useState<string | null>(null);
  const [notification, setNotification] = React.useState<any>(null);

  const registerForPushNotificationsAsync = async (): Promise<string | null> => {
    let token;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return null;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    setExpoPushToken(token);

    // Save token to user profile in Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user && token) {
      await supabase
        .from('user_profiles')
        .update({ expo_push_token: token })
        .eq('user_id', user.id);
    }

    return token;
  };

  const scheduleLocalNotification = (title: string, body: string, data?: any) => {
    Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
  };

  useEffect(() => {
    registerForPushNotificationsAsync();

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      
      // Add to Redux store
      const newNotification = {
        id: notification.request.identifier,
        title: notification.request.content.title || '',
        message: notification.request.content.body || '',
        type: data?.type || 'promotion',
        isRead: false,
        timestamp: new Date().toISOString(),
        actionUrl: data?.actionUrl,
        data: data,
      };
      
      dispatch(addNotification(newNotification));
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const notificationId = response.notification.request.identifier;
      
      // Mark as read when user interacts with notification
      dispatch(markAsRead(notificationId));
      
      // Navigate based on notification data
      const data = response.notification.request.content.data;
      if (data?.actionUrl) {
        // Handle navigation here based on notification type
        console.log('Navigation to:', data.actionUrl);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [dispatch]);

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    registerForPushNotificationsAsync,
    scheduleLocalNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}