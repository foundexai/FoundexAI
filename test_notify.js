const fs = require("fs");
const path = require("path");

// Read .env.local manually
try {
  const envFile = fs.readFileSync(path.join(__dirname, ".env.local"), "utf-8");
  envFile.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const [key, ...valParts] = trimmed.split("=");
    if (key && valParts.length) {
      let val = valParts.join("=").trim().replace(/\r$/, "");
      if (val.startsWith("\"") && val.endsWith("\"")) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      const cleanKey = key.trim().replace(/\r$/, "");
      process.env[cleanKey] = val;
    }
  });
  console.log("Loaded environment from .env.local");
} catch (e) {
  console.error("Failed to load .env.local", e);
}

const mongoose = require("mongoose");
const Pusher = require("pusher");

const MONGODB_URI = process.env.MONGODB_URI;
const PUSHER_APP_ID = process.env.PUSHER_APP_ID;
const PUSHER_KEY = process.env.PUSHER_KEY;
const PUSHER_SECRET = process.env.PUSHER_SECRET;
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER || "eu";

if (!MONGODB_URI || !PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET) {
  console.error("Missing configuration. Check MONGODB_URI and PUSHER keys in .env.local");
  console.log("Details:", { MONGODB_URI: !!MONGODB_URI, PUSHER_APP_ID: !!PUSHER_APP_ID, PUSHER_KEY: !!PUSHER_KEY, PUSHER_SECRET: !!PUSHER_SECRET });
  process.exit(1);
}

const pusher = new Pusher({
  appId: PUSHER_APP_ID,
  key: PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: PUSHER_CLUSTER,
  useTLS: true,
});

const NotificationSchema = new mongoose.Schema({
  recipient_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "system" },
  link: { type: String },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

const USER_ID = "692e82aa0a6e3b3ce9cf5e02";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const title = "❌ Proposal Request Rejected";
  const message = "Your investor proposal request has been rejected. Details are logged in your dashboard.";

  // 1. Save to DB
  const notification = await Notification.create({
    recipient_id: new mongoose.Types.ObjectId(USER_ID),
    title,
    message,
    type: "rejection", // Set to rejection to trigger red styling in Toaster
    link: "/dashboard",
    is_read: false,
  });

  console.log(`Notification saved to MongoDB with ID: ${notification._id}`);

  // 2. Trigger Pusher Event
  const channelName = `private-esign-${USER_ID}`;
  const eventName = "new-notification"; // Default event bound in GlobalNotificationListener

  await pusher.trigger(channelName, eventName, {
    id: notification._id.toString(),
    title: notification.title,
    message: notification.message,
    type: notification.type,
    link: notification.link,
    created_at: notification.created_at,
  });

  console.log(`Pusher event '${eventName}' successfully triggered on channel '${channelName}'!`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Error running test:", err);
  process.exit(1);
});
