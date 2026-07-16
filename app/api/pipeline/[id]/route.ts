import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import PipelineDeal from "@/lib/models/PipelineDeal";
import User from "@/lib/models/User";
import { pusher } from "@/lib/pusher";

// Map upgraded stages back to old 4-stage statuses to preserve reverse compatibility
const STAGE_TO_STATUS: Record<string, string> = {
  "shortlisted": "Not Contacted",
  "outreach_sent": "Emailed",
  "intro_meeting": "In Conversation",
  "due_diligence": "Due Diligence",
  "term_sheet": "Due Diligence",
  "closed_won": "Due Diligence",
  "closed_lost": "Due Diligence",
};

// PATCH: Update pipeline deal (stage drag-and-drop, notes, reminders, activities)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const token = req.headers.get("Authorization")?.split(" ")[1];

    const decoded = await verifyToken(token || "");
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = decoded.user._id;
    const body = await req.json();
    const { stage, dealAmount, notes, nextFollowup, activity, reminderAction, reminder } = body;

    // Fetch existing deal
    const deal = await PipelineDeal.findOne({ _id: id, user_id: userId });
    if (!deal) {
      return NextResponse.json({ error: "Pipeline deal not found" }, { status: 404 });
    }

    const updates: Record<string, any> = { updated_at: new Date() };

    // 1. Stage drag-and-drop transition
    if (stage && stage !== deal.stage) {
      const oldStage = deal.stage;
      updates.stage = stage;
      
      // Auto-append stage transition to activity log
      deal.activity_log.push({
        date: new Date(),
        type: "stage_change",
        description: `Moved stage from "${oldStage}" to "${stage}".`,
      });
      updates.activity_log = deal.activity_log;

      // Sync back to User schema to preserve old statuses
      const legacyStatus = STAGE_TO_STATUS[stage] || "Not Contacted";
      await User.findByIdAndUpdate(userId, {
        $set: { [`investor_statuses.${deal.investor_id}`]: legacyStatus }
      });
    }

    // 2. Deal amount update
    if (typeof dealAmount === "number") {
      updates.deal_amount = dealAmount;
    }

    // 3. Notes update
    if (typeof notes === "string") {
      updates.notes = notes;
    }

    // 4. Next Follow Up Date update
    if (nextFollowup !== undefined) {
      updates.next_followup = nextFollowup ? new Date(nextFollowup) : null;
    }

    // 5. Append Custom Activity
    if (activity) {
      deal.activity_log.push({
        date: new Date(),
        type: activity.type || "note",
        description: activity.description,
      });
      updates.activity_log = deal.activity_log;
    }

    // 6. Inline Reminder management (add, toggle, remove)
    if (reminderAction && reminder) {
      let remindersList = [...(deal.reminders || [])];
      
      if (reminderAction === "add") {
        remindersList.push({
          id: reminder.id || Math.random().toString(36).substring(2, 9),
          description: reminder.description,
          due_date: new Date(reminder.dueDate),
          is_completed: false,
        });
        deal.activity_log.push({
          date: new Date(),
          type: "reminder",
          description: `Created reminder: "${reminder.description}" due on ${new Date(reminder.dueDate).toLocaleDateString()}.`,
        });
      } else if (reminderAction === "toggle") {
        remindersList = remindersList.map(r => 
          r.id === reminder.id ? { ...r, is_completed: !r.is_completed } : r
        );
        const item = remindersList.find(r => r.id === reminder.id);
        deal.activity_log.push({
          date: new Date(),
          type: "reminder",
          description: `Marked reminder "${item?.description}" as ${item?.is_completed ? "completed" : "incomplete"}.`,
        });
      } else if (reminderAction === "remove") {
        const item = remindersList.find(r => r.id === reminder.id);
        remindersList = remindersList.filter(r => r.id !== reminder.id);
        deal.activity_log.push({
          date: new Date(),
          type: "reminder",
          description: `Removed reminder: "${item?.description}".`,
        });
      }
      
      updates.reminders = remindersList;
      updates.activity_log = deal.activity_log;
    }

    const updatedDeal = await PipelineDeal.findOneAndUpdate(
      { _id: id, user_id: userId },
      { $set: updates },
      { new: true }
    );

    // Trigger Pusher update to notify all browsers of changes
    const channelName = `private-esign-${userId}`;
    try {
      await pusher.trigger(channelName, "pipeline-updated", {
        dealId: id,
        stage: updatedDeal.stage,
        dealAmount: updatedDeal.deal_amount,
        updatedAt: updatedDeal.updated_at,
      });
    } catch (e) {
      console.warn("Pusher pipeline update alert failed:", e);
    }

    return NextResponse.json({ success: true, deal: updatedDeal });
  } catch (error) {
    console.error("PATCH pipeline deal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Remove deal from pipeline and User shortlist
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const token = req.headers.get("Authorization")?.split(" ")[1];

    const decoded = await verifyToken(token || "");
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = decoded.user._id;

    // Find and delete the deal
    const deal = await PipelineDeal.findOne({ _id: id, user_id: userId });
    if (!deal) {
      return NextResponse.json({ error: "Pipeline deal not found" }, { status: 404 });
    }

    const investorId = deal.investor_id;
    await PipelineDeal.deleteOne({ _id: id, user_id: userId });

    // Sync deletion back to User shortlist (saved_investors & statuses map)
    await User.findByIdAndUpdate(userId, {
      $pull: { saved_investors: investorId },
      $unset: { [`investor_statuses.${investorId}`]: "" }
    });

    // Trigger Pusher delete notify
    const channelName = `private-esign-${userId}`;
    try {
      await pusher.trigger(channelName, "pipeline-deleted", {
        dealId: id,
        investorId: investorId,
      });
    } catch (e) {
      console.warn("Pusher pipeline delete alert failed:", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE pipeline deal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
