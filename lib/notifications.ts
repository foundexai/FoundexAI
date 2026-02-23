import Notification from "@/lib/models/Notification";
import User from "@/lib/models/User";

const ADMIN_EMAILS = [
  "almussanplanner12@gmail.com",
  "sophzine@gmail.com"
];

export async function notifyAdmins(title: string, message: string, type: string = "system", link?: string) {
  try {
    const admins = await User.find({ email: { $in: ADMIN_EMAILS } });
    if (admins.length === 0) return;

    const notifications = admins.map(admin => ({
      recipient_id: admin._id,
      title,
      message,
      type,
      link
    }));

    await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Error notifying admins:", error);
  }
}

export async function notifyUser(userId: string, title: string, message: string, type: string = "system", link?: string) {
  try {
    await Notification.create({
      recipient_id: userId,
      title,
      message,
      type,
      link
    });
  } catch (error) {
    console.error("Error notifying user:", error);
  }
}
