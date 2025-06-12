/**
 * Global notification system for TM8 application
 * Provides toast-style notifications for user feedback
 */

import React, { useState, useCallback, useEffect } from 'react';
import './NotificationSystem.css';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationSystemProps {
  maxNotifications?: number;
  defaultDuration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

declare global {
  interface Window {
    showNotification: (notification: Omit<Notification, 'id'>) => void;
    hideNotification: (id: string) => void;
    clearAllNotifications: () => void;
  }
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  maxNotifications = 5,
  defaultDuration = 5000,
  position = 'top-right'
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = { 
      ...notification, 
      id,
      duration: notification.duration ?? defaultDuration
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Keep only the max number of notifications
      return updated.slice(0, maxNotifications);
    });
    
    // Auto-remove after duration (if duration > 0)
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
  }, [defaultDuration, maxNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Expose global functions
  useEffect(() => {
    window.showNotification = addNotification;
    window.hideNotification = removeNotification;
    window.clearAllNotifications = clearAllNotifications;
    
    return () => {
      delete window.showNotification;
      delete window.hideNotification;
      delete window.clearAllNotifications;
    };
  }, [addNotification, removeNotification, clearAllNotifications]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`notification-container notification-container--${position}`}>
      {notifications.map((notification, index) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          animationDelay={index * 100}
        />
      ))}
    </div>
  );
};

interface NotificationCardProps {
  notification: Notification;
  onClose: () => void;
  animationDelay: number;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onClose,
  animationDelay
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for animation to complete before removing
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div 
      className={`notification notification--${notification.type} ${
        isVisible ? 'notification--visible' : 'notification--hidden'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="notification__icon">
        {getIcon()}
      </div>
      
      <div className="notification__content">
        <div className="notification__title">
          {notification.title}
        </div>
        
        {notification.message && (
          <div className="notification__message">
            {notification.message}
          </div>
        )}
        
        {notification.action && (
          <button 
            className="notification__action"
            onClick={notification.action.onClick}
          >
            {notification.action.label}
          </button>
        )}
      </div>
      
      <button 
        className="notification__close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

// Utility functions for easy notification creation
export const showSuccess = (title: string, message?: string) => {
  window.showNotification?.({ type: 'success', title, message });
};

export const showError = (title: string, message?: string) => {
  window.showNotification?.({ type: 'error', title, message, duration: 0 }); // Don't auto-hide errors
};

export const showWarning = (title: string, message?: string) => {
  window.showNotification?.({ type: 'warning', title, message });
};

export const showInfo = (title: string, message?: string) => {
  window.showNotification?.({ type: 'info', title, message });
};

export default NotificationSystem;