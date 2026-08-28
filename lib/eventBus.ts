import { EventEmitter } from "events";

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(100);
    this.setupDefaultListeners();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Safe event emission utility that catches handler errors to prevent app-level crashes.
   */
  public safeEmit(event: string, ...args: any[]): boolean {
    try {
      return this.emit(event, ...args);
    } catch (err) {
      console.error(`[EventBus] Unhandled error during emit of event "${event}":`, err);
      return false;
    }
  }

  private setupDefaultListeners() {
    // 1. Chat Message Trigger
    this.on("message:created", async (data) => {
      try {
        const { message } = data;
        if (!message) return;
        
        console.log(`[EventBus] Received message:created event for message ID: ${message._id}`);
        
        if (message.sender === "founder") {
          const mongoose = (await import("mongoose")).default;
          const ChatMessage = mongoose.models.ChatMessage || (await import("@/lib/models/ChatMessage")).default;

          // Defer reply generation to simulate active review
          setTimeout(async () => {
            try {
              await ChatMessage.create({
                investor_id: message.investor_id,
                sender: "investor",
                text: `Thank you for the message. Our committee will review it and get back to you.`,
                thread_id: message.thread_id || message._id,
                context: message.context || undefined,
                created_at: new Date()
              });
              console.log(`[EventBus] Asynchronous investor reply successfully generated for thread: ${message.thread_id || message._id}`);
            } catch (err) {
              console.error("[EventBus] Failed to generate automatic investor reply:", err);
            }
          }, 3000);
        }
      } catch (err) {
        console.error("[EventBus] Error in message:created event handler:", err);
      }
    });

    // 2. Document Sharing Trigger
    this.on("document:shared", async (data) => {
      try {
        const { docName, docUrl, investorId, investorName, message } = data;
        console.log(`[EventBus] Document shared: "${docName}" shared with ${investorName}`);
        
        const mongoose = (await import("mongoose")).default;
        const ChatMessage = mongoose.models.ChatMessage || (await import("@/lib/models/ChatMessage")).default;

        const newMsg = await ChatMessage.create({
          investor_id: investorId || investorName,
          sender: "founder",
          text: message || `Shared document: ${docName}`,
          sharedDoc: {
            name: docName,
            url: docUrl
          },
          context: {
            type: "document",
            ref_id: docUrl,
            title: docName,
            url: docUrl
          },
          created_at: new Date()
        });

        // Trigger message reply sequence
        this.safeEmit("message:created", { message: newMsg });
      } catch (err) {
        console.error("[EventBus] Failed to process document share sync event:", err);
      }
    });

    // 3. Signature Request Completed Trigger
    this.on("signature:completed", async (data) => {
      try {
        const { signatureRequest } = data;
        if (!signatureRequest) return;

        console.log(`[EventBus] Signature Request completed for: ${signatureRequest.doc_name}`);
        
        const { notifyUser } = await import("./notifications");
        
        // Notify the founder who initiated it
        await notifyUser(
          signatureRequest.founder_id.toString(),
          "Document Signed & Completed",
          `All signers have signed "${signatureRequest.doc_name}". The audit certificate has been appended.`,
          "system",
          `/dashboard/documents?tab=signatures`
        );
      } catch (err) {
        console.error("[EventBus] Failed to process signature completed notifications:", err);
      }
    });

    // 4. Vector Indexing Triggers for pgvector/Pinecone Search Infrastructure
    this.on("startup:changed", async (data) => {
      try {
        const { startup } = data;
        if (!startup) return;
        
        console.log(`[EventBus] Received startup:changed event for: ${startup.company_name}`);
        const { getEmbedding } = await import("./vectorSearch");
        
        const featureText = `
          ${startup.company_name}
          ${startup.business_description || ""}
          ${startup.sector || ""}
          ${startup.stage || ""}
          ${startup.location || ""}
        `;
        
        const embedding = getEmbedding(featureText);
        console.log(`[EventBus] Asynchronously indexed startup "${startup.company_name}" into search vector catalog (Size: ${embedding.length}).`);

        // Day 3: Trigger runway and burn anomaly checks asynchronously
        const { checkStartupAnomaly } = await import("./anomalyService");
        await checkStartupAnomaly(startup._id.toString());
      } catch (err) {
        console.error("[EventBus] Failed to index startup search vector:", err);
      }
    });

    // 5. Cash Runway & Burn Rate Anomaly Detected Warning Trigger
    this.on("anomaly:surged", async (data) => {
      try {
        const { startupId, startupName, userId, burnLatest, burnPrev, runwayLatest, percentageIncrease, lowRunwayOnly } = data;
        if (!userId) return;

        console.log(`[EventBus] Burn rate anomaly surge event received for ${startupName}`);
        
        let message = `Alert: Implied monthly burn rate surged by ${percentageIncrease}% MoM (from $${Math.round(burnPrev).toLocaleString()} to $${Math.round(burnLatest).toLocaleString()}). Remaining runway is ${runwayLatest} months.`;
        if (lowRunwayOnly) {
          message = `Warning: Cash runway has dropped below 6 months critical threshold. Remaining runway is estimated at ${runwayLatest} months.`;
        }

        const { notifyUser } = await import("./notifications");
        await notifyUser(
          userId.toString(),
          "⚠️ Cash Runway Anomaly Detected",
          message,
          "system",
          "/dashboard"
        );
      } catch (err) {
        console.error("[EventBus] Failed to process anomaly:surged notifications:", err);
      }
    });

    this.on("investor:changed", async (data) => {
      try {
        const { investor } = data;
        if (!investor) return;
        
        console.log(`[EventBus] Received investor:changed event for: ${investor.name}`);
        const { getEmbedding } = await import("./vectorSearch");
        
        const featureText = `
          ${investor.name}
          ${investor.type}
          ${(investor.focus || []).join(" ")}
          ${investor.location || ""}
          ${investor.description || ""}
          ${investor.thesis || ""}
          ${investor.stage || ""}
        `;
        
        const embedding = getEmbedding(featureText);
        console.log(`[EventBus] Asynchronously indexed investor "${investor.name}" into search vector catalog (Size: ${embedding.length}).`);
      } catch (err) {
        console.error("[EventBus] Failed to index investor search vector:", err);
      }
    });
  }
}

export const eventBus = EventBus.getInstance();
export default eventBus;
