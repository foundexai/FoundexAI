import Pusher from "pusher";

const pusherKey = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

export const isPusherConfigured = !!(
  process.env.PUSHER_APP_ID &&
  pusherKey &&
  process.env.PUSHER_SECRET
);

if (!isPusherConfigured) {
  console.warn("Pusher environment variables are missing. Push notifications will not work.");
}

export const pusher = isPusherConfigured
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: pusherKey!,
      secret: process.env.PUSHER_SECRET!,
      cluster: pusherCluster,
      useTLS: true,
    })
  : ({
      trigger: async () => {
        console.log("[Pusher Mock] Trigger called (Pusher not configured)");
        return {};
      }
    } as unknown as Pusher);