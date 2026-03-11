class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error('Service worker not ready:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error('Service worker not available');
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // This would be your VAPID public key
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f8HtLlVLVWjq-v6hm-8lzJhHqEVPkYk7-jDYJFJLCzUKdMJHEg'
        )
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        return await subscription.unsubscribe();
      }
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async showLocalNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/manifest-icon-192.png',
        badge: '/manifest-icon-96.png',
        ...options
      });
    }
  }

  async scheduleMaintenanceReminder(equipmentName: string, dueDate: Date): Promise<void> {
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    
    if (timeDiff > 0) {
      setTimeout(() => {
        this.showLocalNotification(
          'Maintenance Reminder',
          {
            body: `${equipmentName} maintenance is due today`,
            tag: `maintenance-${equipmentName}`,
            requireInteraction: true,
            actions: [
              {
                action: 'view',
                title: 'View Details'
              },
              {
                action: 'snooze',
                title: 'Remind Later'
              }
            ]
          }
        );
      }, timeDiff);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const notificationService = new NotificationService();