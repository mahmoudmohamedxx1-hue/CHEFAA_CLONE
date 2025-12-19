import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { addNotification } from '@/store/slices/notificationSlice';
import * as Notifications from 'expo-notifications';
import { scheduleLocalNotification } from '@/contexts/NotificationContext';

interface PushNotificationOptions {
  title: string;
  body: string;
  data?: any;
  type?: 'order' | 'delivery' | 'promotion' | 'reminder' | 'security';
  schedule?: boolean;
  delay?: number;
}

export function useNotifications() {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notifications);

  const sendPushNotification = useCallback(async (options: PushNotificationOptions) => {
    try {
      // Schedule local notification
      if (options.schedule && options.delay) {
        setTimeout(() => {
          scheduleLocalNotification(options.title, options.body, options.data);
        }, options.delay);
      } else {
        scheduleLocalNotification(options.title, options.body, options.data);
      }

      // Add to store
      const notification = {
        id: Date.now().toString(),
        title: options.title,
        message: options.body,
        type: options.type || 'promotion',
        isRead: false,
        timestamp: new Date().toISOString(),
        data: options.data,
      };
      
      dispatch(addNotification(notification));
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }, [dispatch]);

  const showOrderNotification = useCallback((orderStatus: string, orderNumber: string) => {
    let title = 'Order Update';
    let message = '';

    switch (orderStatus) {
      case 'confirmed':
        message = `Your order #${orderNumber} has been confirmed and is being prepared.`;
        break;
      case 'shipped':
        message = `Your order #${orderNumber} has shipped and is on the way!`;
        break;
      case 'delivered':
        message = `Your order #${orderNumber} has been delivered. Enjoy your purchase!`;
        break;
      default:
        message = `Your order #${orderNumber} status has been updated to ${orderStatus}.`;
    }

    sendPushNotification({
      title,
      message,
      type: 'order',
      data: { orderNumber, status: orderStatus },
    });
  }, [sendPushNotification]);

  const showDeliveryNotification = useCallback((driverName: string, estimatedTime: string) => {
    sendPushNotification({
      title: 'Delivery Update',
      message: `${driverName} is on the way! Estimated arrival: ${estimatedTime}`,
      type: 'delivery',
      data: { driverName, estimatedTime },
    });
  }, [sendPushNotification]);

  const showPrescriptionReminder = useCallback((medicationName: string, dosage: string) => {
    sendPushNotification({
      title: 'Medication Reminder',
      message: `Time to take your ${medicationName} - ${dosage}`,
      type: 'reminder',
      data: { medicationName, dosage },
    });
  }, [sendPushNotification]);

  const showSecurityAlert = useCallback((message: string) => {
    sendPushNotification({
      title: 'Security Alert',
      message,
      type: 'security',
    });
  }, [sendPushNotification]);

  return {
    notifications,
    unreadCount,
    sendPushNotification,
    showOrderNotification,
    showDeliveryNotification,
    showPrescriptionReminder,
    showSecurityAlert,
  };
}