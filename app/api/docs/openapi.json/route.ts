import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.1.0",
    info: {
      title: "Foundex Developer Gateway API",
      version: "1.0.0",
      description:
        "Official developer API for Foundex.ai — programmatic access to startups, cap tables, investor pipeline, webhooks, and enterprise CRM/financial integrations (HubSpot, QuickBooks, Stripe).",
      contact: {
        name: "Foundex Developer Support",
        email: "api@foundex.ai",
        url: "https://foundex.ai/docs",
      },
    },
    servers: [
      {
        url: "https://foundex.ai",
        description: "Production Server",
      },
      {
        url: "http://localhost:3000",
        description: "Local Development Sandbox",
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "API Key (fdx_live_...)",
          description: "Include 'Authorization: Bearer fdx_live_...' header in your HTTP requests.",
        },
        CustomHeaderAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "Alternatively, pass your key via the 'X-API-Key: fdx_live_...' header.",
        },
      },
      schemas: {
        Startup: {
          type: "object",
          properties: {
            _id: { type: "string" },
            company_name: { type: "string" },
            business_description: { type: "string" },
            sector: { type: "string" },
            stage: { type: "string" },
            mrr: { type: "number" },
            arr: { type: "number" },
            cash_on_hand: { type: "number" },
            monthly_burn: { type: "number" },
          },
        },
        CapTableSummary: {
          type: "object",
          properties: {
            object: { type: "string", example: "captable_summary" },
            startup_id: { type: "string" },
            metrics: {
              type: "object",
              properties: {
                total_shares: { type: "number" },
                total_capital_raised_usd: { type: "number" },
                shareholders_count: { type: "number" },
              },
            },
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  shareholder_name: { type: "string" },
                  shareholder_type: { type: "string" },
                  share_class: { type: "string" },
                  share_count: { type: "number" },
                  currency: { type: "string" },
                  investment_amount: { type: "number" },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "string" },
          },
        },
      },
    },
    security: [{ ApiKeyAuth: [] }, { CustomHeaderAuth: [] }],
    paths: {
      "/api/v1/external/startups": {
        get: {
          summary: "List or query company profile",
          description: "Requires scope `read:startup`.",
          responses: {
            "200": {
              description: "Successful response",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      object: { type: "string", example: "list" },
                      total: { type: "number" },
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Startup" },
                      },
                    },
                  },
                },
              },
            },
            "401": { description: "Unauthorized" },
            "429": { description: "Rate limit exceeded" },
          },
        },
      },
      "/api/v1/external/captable": {
        get: {
          summary: "Get equity breakdown & cap table ledger",
          description: "Requires scope `read:captable`.",
          responses: {
            "200": {
              description: "Cap table ledger",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CapTableSummary" },
                },
              },
            },
            "401": { description: "Unauthorized" },
            "403": { description: "Missing required scope" },
          },
        },
      },
      "/api/v1/external/hubspot/sync": {
        post: {
          summary: "Ingest HubSpot CRM contacts and deal pipelines",
          description: "Requires scope `write:integrations`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    contacts: { type: "array", items: { type: "object" } },
                    deals: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          name: { type: "string" },
                          amount: { type: "number" },
                          stage: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "HubSpot synchronized successfully" },
            "400": { description: "Bad request" },
          },
        },
      },
      "/api/v1/external/quickbooks/sync": {
        post: {
          summary: "Sync financial metrics and invoice totals from QuickBooks",
          description: "Requires scope `write:integrations`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    cashOnHand: { type: "number" },
                    monthlyBurn: { type: "number" },
                    monthlyRevenue: { type: "number" },
                    annualRevenue: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "QuickBooks synchronized" },
          },
        },
      },
      "/api/v1/external/stripe/sync": {
        post: {
          summary: "Sync recurring subscription metrics (MRR, ARR, churn) from Stripe",
          description: "Requires scope `write:integrations`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    mrr: { type: "number" },
                    arr: { type: "number" },
                    activeCustomers: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Stripe synchronized" },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
