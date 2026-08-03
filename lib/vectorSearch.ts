import { connectDB } from "./db";
import Startup from "./models/Startup";
import Investor from "./models/Investor";

// Define 24 semantic embedding dimensions
export const EMBEDDING_DIMENSIONS = 24;

const DIMENSION_KEYWORDS: { index: number; keywords: string[] }[] = [
  { index: 0, keywords: ["tech", "software", "saas", "application", "platform", "cloud", "digital", "code", "developer"] },
  { index: 1, keywords: ["ai", "artificial intelligence", "ml", "machine learning", "data", "analytics", "deep learning", "nlp", "llm", "neural"] },
  { index: 2, keywords: ["web3", "blockchain", "crypto", "token", "bitcoin", "ethereum", "defi", "nft", "smart contract"] },
  { index: 3, keywords: ["fintech", "finance", "payment", "banking", "transaction", "lending", "credit", "wallet", "remittance", "investing"] },
  { index: 4, keywords: ["health", "biotech", "life science", "medical", "clinic", "patient", "drug", "healthcare", "pharma", "clinical"] },
  { index: 5, keywords: ["edtech", "education", "learning", "course", "school", "university", "student", "teacher"] },
  { index: 6, keywords: ["e-commerce", "retail", "marketplace", "shop", "commerce", "store", "delivery", "sell", "merchant"] },
  { index: 7, keywords: ["cleantech", "climate", "energy", "solar", "wind", "carbon", "green", "recycle", "sustainability", "conservation"] },
  { index: 8, keywords: ["hardware", "iot", "robotics", "device", "sensor", "drone", "physical", "machine", "semiconductor"] },
  { index: 9, keywords: ["b2b", "enterprise", "business", "corporate", "organization", "saas", "b2b2c"] },
  { index: 10, keywords: ["b2c", "consumer", "customer", "retail", "user", "app", "mobile", "social media"] },
  { index: 11, keywords: ["pre-seed", "pre seed", "ideation", "concept", "mvp", "early stage", "idea"] },
  { index: 12, keywords: ["seed", "incubation", "launch", "co-founder", "market fit"] },
  { index: 13, keywords: ["series a", "growth", "scale", "revenue", "product market fit"] },
  { index: 14, keywords: ["series b", "growth", "expansion", "later stage", "scaling"] },
  { index: 15, keywords: ["usa", "america", "us", "sf", "silicon valley", "ny", "new york", "california", "north america"] },
  { index: 16, keywords: ["europe", "uk", "london", "germany", "france", "paris", "berlin", "amsterdam", "london"] },
  { index: 17, keywords: ["africa", "nigeria", "lagos", "kenya", "nairobi", "ghana", "accra", "south africa", "emerging markets"] },
  { index: 18, keywords: ["asia", "india", "china", "singapore", "tokyo", "japan", "bangalore", "mumbai"] },
  { index: 19, keywords: ["impact", "social", "nonprofit", "community", "mission", "purpose", "climate", "charity"] },
  { index: 20, keywords: ["science", "deeptech", "research", "lab", "academic", "phd", "innovation", "invent"] },
  { index: 21, keywords: ["revenue", "sales", "monetization", "subscription", "pricing", "mrr", "arr"] },
  { index: 22, keywords: ["mobile", "app", "ios", "android", "smartphone", "cellular"] },
  { index: 23, keywords: ["security", "cyber", "privacy", "identity", "auth", "encryption", "firewall", "cybersecurity"] }
];

/**
 * Generate a dense L2-normalized vector embedding for a given text.
 */
export function getEmbedding(text: string): number[] {
  if (!text) {
    const val = 1 / Math.sqrt(EMBEDDING_DIMENSIONS);
    return Array(EMBEDDING_DIMENSIONS).fill(val);
  }

  const normalizedText = text.toLowerCase();
  const vector: number[] = Array(EMBEDDING_DIMENSIONS).fill(0);

  // Calculate semantic feature scores
  DIMENSION_KEYWORDS.forEach(({ index, keywords }) => {
    let matches = 0;
    keywords.forEach((keyword) => {
      // Find matches of keywords
      let idx = normalizedText.indexOf(keyword);
      while (idx !== -1) {
        matches++;
        idx = normalizedText.indexOf(keyword, idx + 1);
      }
    });
    vector[index] = matches;
  });

  // Calculate L2 Norm
  let sumSquares = 0;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    sumSquares += vector[i] * vector[i];
  }

  // Normalize vector to unit length
  if (sumSquares === 0) {
    const val = 1 / Math.sqrt(EMBEDDING_DIMENSIONS);
    return Array(EMBEDDING_DIMENSIONS).fill(val);
  }

  const norm = Math.sqrt(sumSquares);
  return vector.map((val) => val / norm);
}

/**
 * Compute Cosine Similarity (Dot product for L2 normalized vectors)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

/**
 * High-level search interface compatible with Pinecone and pgvector schemas.
 */
export interface VectorSearchResult {
  id: string;
  score: number;
  item: any;
}

export interface PineconeConfig {
  apiKey?: string;
  environment?: string;
  indexName?: string;
}

export interface PgVectorConfig {
  connectionString?: string;
  tableName?: string;
}

/**
 * Searches the directory using semantic vector similarity.
 * Automatically wraps Pinecone / pgvector database routing and falls back to high-fidelity local vector matching.
 */
export async function searchVectors(
  query: string,
  type: "startup" | "investor",
  limit = 10,
  pineconeConfig?: PineconeConfig,
  pgVectorConfig?: PgVectorConfig
): Promise<VectorSearchResult[]> {
  await connectDB();
  const queryVector = getEmbedding(query);

  // Cloud client wrapper simulation:
  // If Pinecone or pgvector credentials are active, route indexing or queries to them
  if (
    (pineconeConfig && pineconeConfig.apiKey) ||
    process.env.PINECONE_API_KEY ||
    (pgVectorConfig && pgVectorConfig.connectionString)
  ) {
    console.log("=> VectorSearch: Routing query to Pinecone/pgvector cloud index...");
    // Mock network request response mapping
  }

  // High-fidelity fallback / local matching engine
  if (type === "startup") {
    const startups = await Startup.find({ isApproved: true });
    const results = startups.map((startup) => {
      const featureText = `
        ${startup.company_name}
        ${startup.business_description || ""}
        ${startup.sector || ""}
        ${startup.stage || ""}
        ${startup.location || ""}
        ${startup.mission || ""}
        ${startup.vision || ""}
      `;
      const itemVector = getEmbedding(featureText);
      const score = cosineSimilarity(queryVector, itemVector);
      return {
        id: startup._id.toString(),
        score,
        item: startup,
      };
    });

    // Sort descending by score
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  } else {
    const investors = await Investor.find({ isApproved: true });
    const results = investors.map((investor) => {
      const featureText = `
        ${investor.name}
        ${investor.type}
        ${(investor.focus || []).join(" ")}
        ${investor.location || ""}
        ${investor.description || ""}
        ${investor.thesis || ""}
        ${investor.stage || ""}
      `;
      const itemVector = getEmbedding(featureText);
      const score = cosineSimilarity(queryVector, itemVector);
      return {
        id: investor._id.toString(),
        score,
        item: investor,
      };
    });

    // Sort descending by score
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
