import mongoose from "mongoose";
import AuditLog from "./models/AuditLog";

export interface LogActionParams {
  startupId: string | mongoose.Types.ObjectId;
  userId: string | mongoose.Types.ObjectId;
  action: "create" | "update" | "delete";
  entity: string;
  entityId?: string | mongoose.Types.ObjectId;
  details?: any;
}

export async function logAction(params: LogActionParams) {
  try {
    const log = await AuditLog.create({
      startup_id: params.startupId,
      user_id: params.userId,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId,
      details: params.details,
    });
    console.log(`[AuditLogger] Successfully logged "${params.action}" action on "${params.entity}" for Startup: ${params.startupId}`);
    return log;
  } catch (error) {
    console.error("[AuditLogger] Error writing audit log:", error);
  }
}
