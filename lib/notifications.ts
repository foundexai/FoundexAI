import { pusher } from "./pusher";
import Notification from "./models/Notification";
import User from "./models/User";
import { connectDB } from "./db";

interface CreateNotificationOptions {
  userId: string; // MongoDB ObjectId as string
  title: string;
  message: string;
  type?: "submission" | "approval" | "rejection" | "system" | "match";
  senderId?: string;
  link?: string;
}

function getEventNameFromTitle(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes("signature") && lowerTitle.includes("request")) {
    return "signature-requested";
  }
  if (lowerTitle.includes("signed")) {
    return "document-signed";
  }
  if (lowerTitle.includes("declined") || lowerTitle.includes("rejected")) {
    return "document-declined";
  }
  if (lowerTitle.includes("match") || lowerTitle.includes("matched")) {
    return "new-match";
  }
  if (lowerTitle.includes("approved")) {
    return "application-approved";
  }
  if (lowerTitle.includes("submitted")) {
    return "new-submission";
  }
  
  // Default event
  return "new-notification";
}

export async function createNotification({
  userId,
  title,
  message,
  type = "system",
  senderId,
  link,
}: CreateNotificationOptions) {
  await connectDB();

  // Create and save the notification to MongoDB
  const notification = await Notification.create({
    recipient_id: userId,
    sender_id: senderId,
    title,
    message,
    type,
    link,
    is_read: false,
  });

  // Determine the appropriate Pusher event name
  const eventName = getEventNameFromTitle(title);
  
  // Trigger the Pusher event on the user's personal channel
  const channelName = `private-esign-${userId}`;
  
  try {
    await pusher.trigger(channelName, eventName, {
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
      created_at: notification.created_at,
    });

    console.log(`Pusher event ${eventName} triggered for user ${userId} on channel ${channelName}`);
  } catch (pusherError) {
    console.error("Failed to trigger Pusher event:", pusherError);
    // Don't throw - we still saved the notification to the database
  }

  return notification;
}

export async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type: "submission" | "approval" | "rejection" | "system" | "match" = "system",
  link?: string
) {
  return createNotification({ userId, title, message, type, link });
}

const ADMIN_EMAILS = [
  "almussanplanner12@gmail.com",
  "sophzine@gmail.com",
  "Demo@foundex.ai",
  "Interndemo1@foundex.ai",
  "Interndemo2@foundex.ai",
];

export async function notifyAdmins(
  title: string,
  message: string,
  type: "submission" | "approval" | "rejection" | "system" | "match" = "system",
  link?: string
) {
  try {
    await connectDB();
    const admins = await User.find({ email: { $in: ADMIN_EMAILS } });
    if (admins.length === 0) return;

    const notifications = await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin._id.toString(),
          title,
          message,
          type,
          link,
        })
      )
    );
    return notifications;
  } catch (error) {
    console.error("Error notifying admins:", error);
  }
}

// Helper function to trigger collaboration events on document channels
export async function triggerDocumentEvent(
  documentId: string,
  eventName: string,
  data: Record<string, unknown>
) {
  const channelName = `private-document-${documentId}`;
  
  try {
    await pusher.trigger(channelName, eventName, data);
    console.log(`Document event ${eventName} triggered for document ${documentId}`);
  } catch (pusherError) {
    console.error("Failed to trigger document Pusher event:", pusherError);
    throw pusherError;
  }
}