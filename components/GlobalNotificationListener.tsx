"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getPusherClient, setPusherToken, clearPusherTokens } from "@/lib/pusher-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type Pusher from "pusher-js";

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Play first note (soft chime, D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.35);
    
    // Play second note (slightly higher and offset, A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08);
    gain2.gain.setValueAtTime(0.06, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.error("Failed to play notification sound:", err);
  }
};

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
  const queryClient = useQueryClient();
  const lastChannelRef = useRef<string | null>(null);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    const userId = user?.id || (user as any)?._id;
    // Only run if we have valid user and token - prevents auth errors during login/logout
    if (!userId || !token) {
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
    const channelName = `private-esign-${userId}`;
    
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
      
      // Invalidate notifications query to update dropdown list and unread count
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Play notification chime sound
      playNotificationSound();

      const toastOptions = {
        description: notification.message,
        duration: 8000, // Show toast for 8 seconds
        action: notification.link ? {
          label: "View",
          onClick: () => {
            window.location.href = notification.link!;
          },
        } : undefined,
      };

      // Show toast notification with rich colors corresponding to notification type
      if (notification.type === "approval" || notification.type === "match") {
        toast.success(notification.title, toastOptions);
      } else if (notification.type === "rejection") {
        toast.error(notification.title, toastOptions);
      } else if (notification.type === "submission") {
        toast.info(notification.title, toastOptions);
      } else {
        toast(notification.title, toastOptions);
      }

      // Request browser notification permission if not granted
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      // Show native browser notification if permission is granted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/foundex.png",
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
    const currentUserId = userId;
    
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