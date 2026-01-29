import { Investor } from "@/components/InvestorCard";
export type { Investor };

export const MOCK_INVESTORS: Investor[] = [
  {
    id: "1",
    name: "Partech Partners",
    type: "VC",
    focus: ["FinTech", "Enterprise", "DeepTech"],
    location: "Paris / Dakar",
    logoInitial: "P",
    logoColor: "from-red-500 to-orange-500",
    description:
      "Global investment platform for tech and digital companies, with a strong footprint in Africa through the Partech Africa Fund. We invest in high-growth companies that are changing the way we live and work.",
    investmentRange: "$1M - $10M",
    website: "partechpartners.com",
  },
  {
    id: "2",
    name: "Ventures Platform",
    type: "VC",
    focus: ["FinTech", "HealthTech", "AgriTech"],
    location: "Abuja, Nigeria",
    logoInitial: "V",
    logoColor: "from-blue-600 to-indigo-600",
    description:
      "Early-stage discovery fund for Africa, backing category-leading companies solving real problems. We believe in the power of bold entrepreneurs to create a better future.",
    investmentRange: "$100k - $500k",
    website: "venturesplatform.com",
  },
  {
    id: "3",
    name: "Helios Investment",
    type: "PE",
    focus: ["Infrastructure", "Financial Services"],
    location: "London / Lagos",
    logoInitial: "H",
    logoColor: "from-yellow-500 to-amber-600",
    description:
      "The largest Africa-focused private investment firm, bridging international capital and African talent. We focus on building market-leading companies in core sectors.",
    investmentRange: "$10M+",
    website: "heliosinvestment.com",
  },
  {
    id: "4",
    name: "Voltron Capital",
    type: "Angel",
    focus: ["B2B", "SaaS", "Marketplace"],
    location: "Lagos, Nigeria",
    logoInitial: "V",
    logoColor: "from-green-500 to-emerald-600",
    description:
      "Pan-African pre-seed & seed firm for elite founders. We back founders who do more with less and are obsessed with solving difficult problems.",
    investmentRange: "$20k - $100k",
    website: "voltroncapital.com",
  },
  {
    id: "5",
    name: "Norrsken22",
    type: "VC",
    focus: ["EdTech", "MedTech", "FinTech"],
    location: "Kigali, Rwanda",
    logoInitial: "N",
    logoColor: "from-purple-500 to-pink-500",
    description:
      "Tech growth fund backed by an international network of tech unicorns, partnering with exceptional founders to build the next generation of African giants.",
    investmentRange: "$2M - $15M",
    website: "norrsken22.com",
  },
  {
    id: "6",
    name: "TLcom Capital",
    type: "VC",
    focus: ["TMT", "Mobile", "Software"],
    location: "Nairobi / Lagos",
    logoInitial: "T",
    logoColor: "from-cyan-500 to-blue-500",
    description:
      "Investing in tech-enabled companies in Sub-Saharan Africa since 1999. We look for companies with the potential to become category leaders.",
    investmentRange: "$500k - $8M",
    website: "tlcomcapital.com",
  },
  {
    id: "7",
    name: "Microtraction",
    type: "Angel",
    focus: ["SaaS", "Consumer", "Crypto"],
    location: "Lagos, Nigeria",
    logoInitial: "M",
    logoColor: "from-gray-700 to-gray-900",
    description:
      "We identify the best technical founders in Africa and provide them with pre-seed funding and professional support to build their startups.",
    investmentRange: "$25k - $150k",
    website: "microtraction.com",
  },
  {
    id: "8",
    name: "Ingressive Capital",
    type: "VC",
    focus: ["Internet", "Mobile"],
    location: "Lagos, Nigeria",
    logoInitial: "I",
    logoColor: "from-teal-400 to-teal-600",
    description:
      "Pre-seed/Seed checks into tech-enabled companies across Sub-Saharan Africa. We provide access to global networks and resources.",
    investmentRange: "$50k - $400k",
    website: "ingressivecapital.com",
  },
];

export interface Startup {
  id: string;
  name: string;
  sector: string;
  stage: string;
  location: string;
  logoInitial: string;
  logoColor: string;
  description: string;
  website?: string;
  traction?: string;
}

export const MOCK_STARTUPS: Startup[] = [
  {
    id: "1",
    name: "Paystack",
    sector: "Fintech",
    stage: "Acquired (Stripe)",
    location: "Lagos, Nigeria",
    logoInitial: "P",
    logoColor: "from-blue-500 to-cyan-500",
    description:
      "Modern online payment processing for African businesses. Easy to integrate and broadly supported.",
    website: "paystack.com",
    traction: "60k+ Businesses",
  },
  {
    id: "2",
    name: "Flutterwave",
    sector: "Fintech",
    stage: "Series D",
    location: "Lagos / SF",
    logoInitial: "F",
    logoColor: "from-orange-400 to-yellow-500",
    description:
      "Payment technology company focused on helping banks and businesses provide seamless and secure payment experiences.",
    website: "flutterwave.com",
    traction: "$3B+ Valuation",
  },
  {
    id: "3",
    name: "Andela",
    sector: "EdTech / HR",
    stage: "Series E",
    location: "Remote / Pan-Africa",
    logoInitial: "A",
    logoColor: "from-green-500 to-teal-500",
    description:
      "Global talent network that connects companies with engineering talent in emerging markets.",
    website: "andela.com",
    traction: "Unicorn Status",
  },
  {
    id: "4",
    name: "Kobo360",
    sector: "Logistics",
    stage: "Series B",
    location: "Lagos, Nigeria",
    logoInitial: "K",
    logoColor: "from-purple-600 to-indigo-600",
    description:
      "Logistics platform that aggregates end-to-end haulage operations to help cargo owners, truck owners, and drivers.",
    website: "kobo360.com",
    traction: "50k+ Trucks",
  },
  {
    id: "5",
    name: "Cowrywise",
    sector: "WealthTech",
    stage: "Series A",
    location: "Lagos, Nigeria",
    logoInitial: "C",
    logoColor: "from-blue-600 to-indigo-700",
    description:
      "Wealth management platform that helps Nigerians plan, save, and invest money easily.",
    website: "cowrywise.com",
    traction: "200k+ Users",
  },
  {
    id: "6",
    name: "54gene",
    sector: "HealthTech",
    stage: "Series B",
    location: "Lagos / DC",
    logoInitial: "5",
    logoColor: "from-red-500 to-pink-500",
    description:
      "Health technology company advancing the state of healthcare through inclusion of African genomic data.",
    website: "54gene.com",
    traction: "Key Partnerships",
  },
];
