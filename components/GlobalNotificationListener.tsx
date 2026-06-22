"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPusherClient, setPusherToken, clearPusherTokens } from "@/lib/pusher-client";
import { toast } from "sonner";
import type Pusher from "pusher-js";

interface PusherNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  created_at: string;
}

export default function GlobalNotificationListener() {
  const { user, token } = useAuth();
  const lastChannelRef = useRef<string | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    // Only run if we have valid user and token - prevents auth errors during login/logout
    if (!user?.id || !token) {
      // Cleanup existing connection if user logs out
      if (pusherRef.current && lastChannelRef.current) {
        pusherRef.current.unsubscribe(lastChannelRef.current);
        clearPusherTokens();
        lastChannelRef.current = null;
        pusherRef.current = null;
      }
      return;
    }

    // Set the Pusher token from the auth context token
    setPusherToken(token);

    const pusher = getPusherClient();
    if (!pusher) return;

    // Subscribe to the user's personal notification channel
    const channelName = `private-esign-${user.id}`;
    
    // Prevent duplicate subscriptions to the same channel
    if (lastChannelRef.current === channelName && pusherRef.current) {
      return;
    }
    
    // Cleanup previous channel if switching users
    if (lastChannelRef.current && pusherRef.current) {
      pusherRef.current.unsubscribe(lastChannelRef.current);
    }
    
    const channel = pusher.subscribe(channelName);
    lastChannelRef.current = channelName;
    pusherRef.current = pusher;

    console.log(`Subscribed to Pusher channel: ${channelName}`);

    // Notification handler factory
    const handleNotification = (notification: PusherNotification) => {
      console.log("Received notification:", notification);
      
      // Show toast notification
      toast(notification.title, {
        description: notification.message,
        action: notification.link ? {
          label: "View",
          onClick: () => {
            window.location.href = notification.link!;
          },
        } : undefined,
      });

      // Request browser notification permission if not granted
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      // Show native browser notification if permission is granted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
        });
      }
    };

    // Bind to all possible events
    channel.bind("signature-requested", handleNotification);
    channel.bind("document-signed", handleNotification);
    channel.bind("document-declined", handleNotification);
    channel.bind("new-match", handleNotification);
    channel.bind("application-approved", handleNotification);
    channel.bind("new-submission", handleNotification);
    channel.bind("new-notification", handleNotification);

    // Handle subscription errors
    channel.bind("pusher:subscription_error", (error: unknown) => {
      console.error("Pusher subscription error:", error);
    });

    // Capture the current channel name and user id for cleanup
    const currentChannelName = channelName;
    const currentUserId = user.id;
    
    // Cleanup on unmount or user change
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(currentChannelName);
      console.log(`Unsubscribed from Pusher channel: ${currentChannelName} for user ${currentUserId}`);
    };
  }, [user]);

  // This component doesn't render anything
  return null;
}