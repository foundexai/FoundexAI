import "./load-env";
import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import ApiKey from "../lib/models/ApiKey";
import WebhookEndpoint from "../lib/models/WebhookEndpoint";
import WebhookLog from "../lib/models/WebhookLog";
import ExternalIntegration from "../lib/models/ExternalIntegration";
import Startup from "../lib/models/Startup";
import CapTable from "../lib/models/CapTable";
import PipelineDeal from "../lib/models/PipelineDeal";
import AuditLog from "../lib/models/AuditLog";

async function optimizeDatabaseIndexes() {
  console.log("===============================================================================");
  console.log("⚡ STARTING DATABASE INDEX OPTIMIZATION (HIGH THROUGHPUT GATEWAY)");
  console.log("===============================================================================\n");

  await connectDB();

  try {
    console.log("1️⃣  Building and verifying indexes on API Gateway collections...");

    // 1. ApiKey indexes
    console.log("   -> Ensuring indexes on ApiKey...");
    await ApiKey.createIndexes();
    const apiKeyIndexes = await ApiKey.collection.indexes();
    console.log(`      ✅ ApiKey has ${apiKeyIndexes.length} active indexes.`);

    // 2. WebhookEndpoint indexes
    console.log("   -> Ensuring indexes on WebhookEndpoint...");
    await WebhookEndpoint.createIndexes();
    const webhookIndexes = await WebhookEndpoint.collection.indexes();
    console.log(`      ✅ WebhookEndpoint has ${webhookIndexes.length} active indexes.`);

    // 3. WebhookLog indexes
    console.log("   -> Ensuring indexes on WebhookLog...");
    await WebhookLog.createIndexes();
    const webhookLogIndexes = await WebhookLog.collection.indexes();
    console.log(`      ✅ WebhookLog has ${webhookLogIndexes.length} active indexes.`);

    // 4. ExternalIntegration indexes
    console.log("   -> Ensuring indexes on ExternalIntegration...");
    await ExternalIntegration.createIndexes();
    const integrationIndexes = await ExternalIntegration.collection.indexes();
    console.log(`      ✅ ExternalIntegration has ${integrationIndexes.length} active indexes.`);

    // 5. Core relational collections
    console.log("   -> Ensuring indexes on core collections (Startup, CapTable, PipelineDeal, AuditLog)...");
    await Promise.all([
      Startup.createIndexes(),
      CapTable.createIndexes(),
      PipelineDeal.createIndexes(),
      AuditLog.createIndexes(),
    ]);
    console.log("      ✅ Core collections indexed.");

    console.log("\n===============================================================================");
    console.log("🎉 DATABASE INDEX OPTIMIZATION COMPLETE: ALL HIGH-CONCURRENCY INDEXES READY");
    console.log("===============================================================================");
  } finally {
    await mongoose.disconnect();
  }
}

optimizeDatabaseIndexes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Index optimization error:", err);
    process.exit(1);
  });
