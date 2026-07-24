import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Task from "@/lib/models/Task";
import Startup from "@/lib/models/Startup";

const DUE_DILIGENCE_TEMPLATES: Record<string, Array<{ title: string; category: string; description: string; priority: string }>> = {
  "Pre-Seed": [
    { title: "Incorporate Entity & File Articles of Organization", category: "Legal", description: "Verify legal incorporation documents and corporate registry status.", priority: "high" },
    { title: "Founder IP Assignment Agreements", category: "Legal", description: "Ensure all co-founders have signed full IP assignment agreements transferring code/assets to company.", priority: "high" },
    { title: "Cap Table Shareholder Ledger Verification", category: "Finance", description: "Verify equity ownership percentages, share counts, and founder vesting terms.", priority: "high" },
    { title: "12-Month Financial Cash Flow Runway Projection", category: "Finance", description: "Prepare monthly operating expense budget and projected cash runway.", priority: "medium" },
    { title: "Key Technical Architecture & Software Dependencies Document", category: "Operations", description: "Document core tech stack, cloud infrastructure providers, and open-source licenses.", priority: "medium" },
  ],
  Seed: [
    { title: "Full Cap Table Audit & Convertible SAFE Terms Review", category: "Finance", description: "Audit outstanding SAFEs, notes, and fully-diluted ownership prior to round.", priority: "high" },
    { title: "2-Year Historical Financial Statements & Bank Reconciliations", category: "Finance", description: "Provide P&L, balance sheets, and monthly bank statements.", priority: "high" },
    { title: "Employee & Contractor Standard Agreements Audit", category: "Legal", description: "Confirm all team members have signed offer letters, IP assignments, and NDAs.", priority: "high" },
    { title: "Customer Case Studies & Top Enterprise Contracts Review", category: "Market", description: "Gather top customer contracts, LOIs, or case study metrics.", priority: "medium" },
    { title: "Data Privacy & GDPR Compliance Audit", category: "Operations", description: "Audit data handling, privacy policy, and user consent mechanisms.", priority: "medium" },
    { title: "Trademark & Intellectual Property Filing Verification", category: "Legal", description: "Verify registered trademarks, domain ownership, and patent disclosures.", priority: "medium" },
  ],
  "Series A": [
    { title: "Audited Financial Statements (Last 2 Fiscal Years)", category: "Finance", description: "Provide CPA-audited or reviewed financial statements and GAAP reconciliations.", priority: "high" },
    { title: "Corporate Governance & Board Resolutions Binder", category: "Legal", description: "Compile all past board minutes, shareholder consents, and charter amendments.", priority: "high" },
    { title: "Tax Compliance & Multi-State / International Filings", category: "Finance", description: "Confirm state/federal corporate tax filings and sales tax compliance.", priority: "high" },
    { title: "SOC2 Type II / Cybersecurity Compliance Certificate", category: "Operations", description: "Provide latest SOC2 audit report or third-party penetration test results.", priority: "medium" },
    { title: "Material Vendor & Partner Contracts Review", category: "Operations", description: "Audit vendor contracts over $25k/yr and partner distribution terms.", priority: "medium" },
    { title: "Key Executive Employment Contracts & ESOP Vesting Audit", category: "Legal", description: "Verify executive employment agreements, change-of-control provisions, and ESOP pool.", priority: "high" },
  ],
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const token = req.headers.get("Authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyToken(token, true);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { user } = decoded;
    const { stage = "Seed" } = await req.json();

    const startup = await Startup.findOne({ user_id: user._id });
    if (!startup) {
      return NextResponse.json({ error: "Startup profile not found" }, { status: 404 });
    }

    const templateItems = DUE_DILIGENCE_TEMPLATES[stage] || DUE_DILIGENCE_TEMPLATES["Seed"];

    // Insert tasks for startup
    const createdTasks = [];
    for (const item of templateItems) {
      // Check if task already exists
      const existing = await Task.findOne({
        startup_id: startup._id,
        title: item.title,
      });

      if (!existing) {
        const newTask = await Task.create({
          startup_id: startup._id,
          title: item.title,
          description: item.description,
          category: item.category,
          priority: item.priority,
          status: "pending",
        });
        createdTasks.push(newTask);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${createdTasks.length} due diligence tasks for ${stage} stage.`,
      tasks: createdTasks,
    });
  } catch (err: any) {
    console.error("Error generating due diligence checklists:", err);
    return NextResponse.json({ error: "Failed to generate due diligence checklists" }, { status: 500 });
  }
}
