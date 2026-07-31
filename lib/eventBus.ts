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

  private setupDefaultListeners() {
    // Register asynchronous event handlers here (Event-Driven decoupled flow)
    this.on("message:created", async (data) => {
      const { message, token } = data;
      console.log(`[EventBus] Received message:created event for message ID: ${message._id}`);
      
      // Auto-reply generation logic triggered asynchronously from message creation
      if (message.sender === "founder") {
        try {
          // Import mongoose and ChatMessage dynamically to prevent circular dependencies or premature model loading
          const mongoose = (await import("mongoose")).default;
          const ChatMessage = mongoose.models.ChatMessage || (await import("@/lib/models/ChatMessage")).default;

          // We defer this work slightly to simulate an investor reviewing the message
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
        } catch (err) {
          console.error("[EventBus] Event handler import error:", err);
        }
      }
    });

    this.on("document:shared", async (data) => {
      const { share, companyName, docName, docUrl, investorId, investorName, message } = data;
      console.log(`[EventBus] Document shared: ${docName} shared with ${investorName}`);
      
      try {
        const mongoose = (await import("mongoose")).default;
        const ChatMessage = mongoose.models.ChatMessage || (await import("@/lib/models/ChatMessage")).default;

        // Add founder message with document attachment in chat log
        const newMsg = await ChatMessage.create({
          investor_id: investorId || investorName,
          sender: "founder",
          text: message,
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

        // Trigger message auto-reply asynchronously
        this.emit("message:created", { message: newMsg });
      } catch (err) {
        console.error("[EventBus] Failed to process document share sync event:", err);
      }
    });
  }
}

export const eventBus = EventBus.getInstance();
