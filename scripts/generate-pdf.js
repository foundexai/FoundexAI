const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Create public/reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '../public/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const REPORTS_CONFIG = [
  {
    filename: 'venture-debt-revolution.pdf',
    title: 'THE VENTURE DEBT\nREVOLUTION',
    subtitle: 'IN AFRICA\'S TECH ECOSYSTEM',
    desc: 'How alternative non-dilutive capital is scaling digital hubs across Nigeria, Kenya, Egypt & South Africa.',
    bgColor: '#0B0F19',
    accentColor: '#EAB308',
    secTitle1: '1. Executive Summary & Context',
    secTitle2: '2. Case Study: Nigeria Fintech',
    secTitle3: '3. Strategic Outlook & Conclusions',
    tableTitle: 'Nigeria Fintech Funding & Debt Trajectory (2020 - 2024)',
    tableData: [
      { year: "2020", total: "$439 Million", debtShare: "19%" },
      { year: "2021", total: "$1.37 Billion", debtShare: "22%" },
      { year: "2022", total: "$1.20 Billion", debtShare: "28%" },
      { year: "2023", total: "$960 Million", debtShare: "35%" },
      { year: "2024", total: "$2.00 Billion", debtShare: "41%" }
    ],
    calloutText: "Key Takeaway: The rising percentage of debt share (reaching 41% in 2024) shows that mature startups are using revenue-based finance and warehouse credit facilities to scale their asset books, leaving equity to fund high-risk product development."
  },
  {
    filename: 'saas-expansion.pdf',
    title: 'SILICON SAVANNAH\nSAAS EXPANSION',
    subtitle: 'SUBSCRIPTION SCALABILITY IN EAST AFRICA',
    desc: 'Deep-dive into retention metrics, local pricing corridors, and expansion frameworks for East African software products.',
    bgColor: '#0D1B2A',
    accentColor: '#3A86C8',
    secTitle1: '1. SaaS Dynamics in East Africa',
    secTitle2: '2. Case Study: Kenya SaaS Playbook',
    secTitle3: '3. Market Projections & Scalability',
    tableTitle: 'East African SaaS ARR Growth & Churn Trends (2020 - 2024)',
    tableData: [
      { year: "2020", total: "$45 Million ARR", debtShare: "14% Churn" },
      { year: "2021", total: "$98 Million ARR", debtShare: "12% Churn" },
      { year: "2022", total: "$160 Million ARR", debtShare: "9% Churn" },
      { year: "2023", total: "$210 Million ARR", debtShare: "8.5% Churn" },
      { year: "2024", total: "$340 Million ARR", debtShare: "7.2% Churn" }
    ],
    calloutText: "Key Takeaway: Improving internet penetration and digital banking integrations in Kenya have driven down churn rates. Local enterprises are increasingly trusting native B2B SaaS solutions over foreign alternatives."
  },
  {
    filename: 'cleantech-arbitrage.pdf',
    title: 'CLEANTECH & SOLAR\nARBITRAGE',
    subtitle: 'DECENTRALIZED ENERGY INVESTMENT MAP',
    desc: 'Analysis of localized solar grids, commercial offsets, and project financing frameworks in South Africa\'s energy transition.',
    bgColor: '#0A2F1D',
    accentColor: '#10B981',
    secTitle1: '1. Decentralized Solar Power Growth',
    secTitle2: '2. Case Study: South Africa Commercial Grids',
    secTitle3: '3. Regulatory Shifts & Project Finance',
    tableTitle: 'SA Commercial Solar Capacity & Project Debt (2020 - 2024)',
    tableData: [
      { year: "2020", total: "140 MW Installed", debtShare: "$65M Debt" },
      { year: "2021", total: "310 MW Installed", debtShare: "$110M Debt" },
      { year: "2022", total: "580 MW Installed", debtShare: "$240M Debt" },
      { year: "2023", total: "950 MW Installed", debtShare: "$390M Debt" },
      { year: "2024", total: "1.45 GW Installed", debtShare: "$720M Debt" }
    ],
    calloutText: "Key Takeaway: The removal of licensing thresholds for self-generation has unlocked substantial private infrastructure debt, accelerating decentralized solar storage financing across commercial centers."
  },
  {
    filename: 'agtech-yield.pdf',
    title: 'AI & AGTECH YIELD\nOPTIMIZATION',
    subtitle: 'MACHINE LEARNING IN AFRICAN AGRICULTURE',
    desc: 'How satellite imaging and specialized computer vision pipelines are improving crop outputs and risk forecasting.',
    bgColor: '#1C1917',
    accentColor: '#F97316',
    secTitle1: '1. Satellite Sensing & Yield Analytics',
    secTitle2: '2. Case Study: North Africa Crop Modeling',
    secTitle3: '3. Climate Resilience & Risk Advisory',
    tableTitle: 'AgTech Adoption Rates & Farm Yield Index (2020 - 2024)',
    tableData: [
      { year: "2020", total: "1.2M Smallholders", debtShare: "+8% Yield" },
      { year: "2021", total: "2.8M Smallholders", debtShare: "+11% Yield" },
      { year: "2022", total: "4.5M Smallholders", debtShare: "+15% Yield" },
      { year: "2023", total: "6.9M Smallholders", debtShare: "+19% Yield" },
      { year: "2024", total: "9.8M Smallholders", debtShare: "+24% Yield" }
    ],
    calloutText: "Key Takeaway: By using automated weather alerts and computer vision soil diagnostics, smallholder co-ops have reduced harvest losses and increased predictability for trade financing partners."
  },
  {
    filename: 'fintech-rails.pdf',
    title: 'CROSS-BORDER\nFINTECH RAILS',
    subtitle: 'PAN-AFRICAN SETTLEMENTS & CORRIDORS',
    desc: 'Deep-dive into fintech payment corridors, currency hedges, and the emergence of PAPSS in regional liquidity settlement.',
    bgColor: '#2E1065',
    accentColor: '#A855F7',
    secTitle1: '1. Local Currency Corridors & Liquidity',
    secTitle2: '2. Case Study: PAPSS Regional Hubs',
    secTitle3: '3. Transaction Clearing & Regulatory Alignment',
    tableTitle: 'Pan-African Cross-Border Digital Volumes (2020 - 2024)',
    tableData: [
      { year: "2020", total: "$12 Billion Vol", debtShare: "$80M Liquidity" },
      { year: "2021", total: "$28 Billion Vol", debtShare: "$190M Liquidity" },
      { year: "2022", total: "$42 Billion Vol", debtShare: "$310M Liquidity" },
      { year: "2023", total: "$68 Billion Vol", debtShare: "$540M Liquidity" },
      { year: "2024", total: "$105 Billion Vol", debtShare: "$980M Liquidity" }
    ],
    calloutText: "Key Takeaway: Integrated settlement systems are bypassing intermediary USD clearing routes. This decreases cost-per-transaction and helps settle regional trade in local fiat currencies."
  },
  {
    filename: 'fintech-2025.pdf',
    title: 'FINTECH REPORT\n2025',
    subtitle: 'NIGERIA EXECUTIVE SUMMARY',
    desc: 'Deep-dive institutional research into neo-banking, settlement infrastructure, and equity-to-debt funding transitions.',
    bgColor: '#1E1B4B',
    accentColor: '#3B82F6',
    secTitle1: '1. Executive Summary',
    secTitle2: '2. Neo-Banking Trends',
    secTitle3: '3. Strategic Conclusions',
    tableTitle: 'Nigeria Fintech Capitalization Metrics (2020 - 2024)',
    tableData: [
      { year: "2020", total: "$439 Million", debtShare: "19%" },
      { year: "2021", total: "$1.37 Billion", debtShare: "22%" },
      { year: "2022", total: "$1.20 Billion", debtShare: "28%" },
      { year: "2023", total: "$960 Million", debtShare: "35%" },
      { year: "2024", total: "$2.00 Billion", debtShare: "41%" }
    ],
    calloutText: "Summary: Funding structures are shifting heavily toward non-dilutive facilities, helping payments and infrastructure operators scale local operations while preserving equity value."
  },
  {
    filename: 'agritech-trends.pdf',
    title: 'AGRITECH TRENDS\n& OPPORTUNITIES',
    subtitle: 'SMALLHOLDER INTEGRATION & TRADE FINANCE',
    desc: 'Analysis of local sourcing corridors, sat-imaging yield indexing, and warehouse receipt systems across East & West Africa.',
    bgColor: '#064E3B',
    accentColor: '#EAB308',
    secTitle1: '1. Smallholder Sourcing Context',
    secTitle2: '2. Case Study: East Africa Agritech',
    secTitle3: '3. Yield Indexing & Risk Assessment',
    tableTitle: 'Agritech Integration & Farm Outcomes (2020 - 2024)',
    tableData: [
      { year: "2020", total: "1.2 Million Farms", debtShare: "+8%" },
      { year: "2021", total: "2.8 Million Farms", debtShare: "+11%" },
      { year: "2022", total: "4.5 Million Farms", debtShare: "+15%" },
      { year: "2023", total: "6.9 Million Farms", debtShare: "+19%" },
      { year: "2024", total: "9.8 Million Farms", debtShare: "+24%" }
    ],
    calloutText: "Summary: Integrated yield analytics and weather alerts are reducing harvest volatility, creating bankable balance sheets for smallholder cooperatives."
  },
  {
    filename: 'clean-energy.pdf',
    title: 'CLEAN ENERGY\nINVESTMENT MAP',
    subtitle: 'DECENTRALIZED POWER & ENERGY ARBITRAGE',
    desc: 'Exploring commercial solar rollouts, utility wheeling frameworks, and micro-grid debt structures in sub-Saharan Africa.',
    bgColor: '#0F172A',
    accentColor: '#10B981',
    secTitle1: '1. Solar Grid Commercial Rollouts',
    secTitle2: '2. Case Study: Decentralized Storage',
    secTitle3: '3. Utility Wheeling & Project Finance',
    tableTitle: 'Decentralized Solar Capacity & Financing (2020 - 2024)',
    tableData: [
      { year: "2020", total: "140 MW Cap", debtShare: "$65M" },
      { year: "2021", total: "310 MW Cap", debtShare: "$110M" },
      { year: "2022", total: "580 MW Cap", debtShare: "$240M" },
      { year: "2023", total: "950 MW Cap", debtShare: "$390M" },
      { year: "2024", total: "1.45 GW Cap", debtShare: "$720M" }
    ],
    calloutText: "Summary: Regulatory deregulations have unlocked substantial private solar installations, enabling robust institutional infrastructure debt facilities."
  },
  {
    filename: 'edtech-landscape.pdf',
    title: 'EDTECH GROWTH\nLANDSCAPE',
    subtitle: 'K-12 & VOCATIONAL SOFTWARE CHANNELS',
    desc: 'How digital learning platforms are scaling distribution models, localizing curricula, and stabilizing unit economics.',
    bgColor: '#1C1917',
    accentColor: '#F43F5E',
    secTitle1: '1. Vocational Distribution Channels',
    secTitle2: '2. Case Study: Adaptive Learning Systems',
    secTitle3: '3. Curriculum Localization & Unit Economics',
    tableTitle: 'Edtech SaaS Subscriptions & ARR Growth (2020 - 2024)',
    tableData: [
      { year: "2020", total: "1.2 Million Users", debtShare: "$12M ARR" },
      { year: "2021", total: "2.4 Million Users", debtShare: "$24M ARR" },
      { year: "2022", total: "3.8 Million Users", debtShare: "$41M ARR" },
      { year: "2023", total: "5.5 Million Users", debtShare: "$60M ARR" },
      { year: "2024", total: "7.8 Million Users", debtShare: "$85M ARR" }
    ],
    calloutText: "Summary: Mobile-first distribution channels and localized K-12 learning systems are improving student retention rates and lifetime value indexes."
  }
];

function generateReport(config) {
  const pdfPath = path.join(reportsDir, config.filename);
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const writeStream = fs.createWriteStream(pdfPath);

  doc.pipe(writeStream);

  // ==========================================
  // PAGE 1: COVER PAGE
  // ==========================================
  doc.rect(0, 0, 595.28, 841.89).fill(config.bgColor);

  // Left margin accent strip
  doc.rect(0, 0, 15, 841.89).fill(config.accentColor);

  // Cover Content
  doc.fillColor('#94A3B8')
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('FOUNDEXAI MARKET INTELLIGENCE', 60, 180, { characterSpacing: 1.5 });

  doc.rect(60, 210, 350, 4).fill(config.accentColor);

  doc.fillColor('#F8FAFC')
     .fontSize(36)
     .font('Helvetica-Bold')
     .text(config.title, 60, 240, { lineGap: 10 });

  doc.fillColor(config.accentColor)
     .fontSize(22)
     .font('Helvetica-Bold')
     .text(config.subtitle, 60, 350);

  doc.fillColor('#94A3B8')
     .fontSize(15)
     .font('Helvetica')
     .text(config.desc, 60, 400, { width: 420, lineGap: 6 });

  doc.fillColor('#64748B')
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('DATE OF PUBLICATION:', 60, 680)
     .font('Helvetica')
     .text('JUNE 2026', 200, 680)
     
     .font('Helvetica-Bold')
     .text('REPORT NUMBER:', 60, 700)
     .font('Helvetica')
     .text(`FDX-2026-${config.filename.substring(0, 4).toUpperCase()}`, 200, 700)
     
     .font('Helvetica-Bold')
     .text('CLASSIFICATION:', 60, 720)
     .font('Helvetica')
     .text('PROPRIETARY / MARKET RESEARCH', 200, 720);

  // ==========================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ==========================================
  doc.addPage();

  doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text('FOUNDEXAI MARKET INTELLIGENCE REPORT  |  ECOSYSTEM TRENDS', 50, 40);
  doc.moveTo(50, 52).lineTo(545.28, 52).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

  doc.fillColor('#0F172A').fontSize(22).font('Helvetica-Bold').text(config.secTitle1, 50, 80);
  doc.rect(50, 110, 40, 3).fill(config.accentColor);

  const introText1 = `The regional growth trajectory for this sector highlights a major shift toward structural maturity. As early venture allocations consolidate, startups and institutional advisors are leveraging customized capital combinations to preserve capitalization tables while funding expansion.`;
  const introText2 = `Over the last five years, data analytics and local financing corridors have evolved to mitigate foreign currency volatility. Industry metrics in 2025 reveal that debt facilities and revenue-based structures represent a significant portion of active capital pools, serving as an efficient runway extension for sustainable operators.`;

  doc.fillColor('#334155').fontSize(11).font('Helvetica').text(introText1, 50, 130, { width: 495.28, lineGap: 6 });
  doc.text(introText2, 50, 205, { width: 495.28, lineGap: 6 });

  doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('Key Highlights & Core Takeaways', 50, 290);

  const bulletItems = [
    { label: "Preservation of Equity:", desc: "Optimizing capitalization tables by using non-dilutive facilities for asset acquisition and inventory growth." },
    { label: "Predictable Margin Fit:", desc: "High compatibility with platforms displaying robust transaction records and predictable customer retention indexes." },
    { label: "Local Pool Maturity:", desc: "Expansion of domestic credit partnerships, improving overall resilience against global macroeconomic headwinds." }
  ];

  let bulletY = 320;
  bulletItems.forEach(item => {
    doc.rect(50, bulletY + 3, 6, 6).fill(config.accentColor);
    doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text(item.label, 65, bulletY);
    doc.fillColor('#475569').fontSize(10).font('Helvetica').text(item.desc, 65, bulletY + 14, { width: 480, lineGap: 4 });
    bulletY += 55;
  });

  // ==========================================
  // PAGE 3: CASE STUDY & DATA
  // ==========================================
  doc.addPage();

  doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text('FOUNDEXAI MARKET INTELLIGENCE REPORT  |  ECOSYSTEM TRENDS', 50, 40);
  doc.moveTo(50, 52).lineTo(545.28, 52).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

  doc.fillColor('#0F172A').fontSize(22).font('Helvetica-Bold').text(config.secTitle2, 50, 80);
  doc.rect(50, 110, 40, 3).fill(config.accentColor);

  const caseSummary = `Detailed market surveys showcase how hubs are scaling local solutions. Underpinning this trajectory is the increase in technology-driven underwriting and database clearing. The case data below highlights historical transaction values and scale metrics indicating robust compound growth.`;
  doc.fillColor('#334155').fontSize(11).font('Helvetica').text(caseSummary, 50, 130, { width: 495.28, lineGap: 6 });

  doc.fillColor('#0F172A').fontSize(13).font('Helvetica-Bold').text(config.tableTitle, 50, 210);

  // Table Structure
  doc.rect(50, 235, 495.28, 25).fill('#0F172A');
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold').text('Year', 65, 243);
  doc.text('Key Metric / Capacity', 180, 243);
  doc.text('Performance Index', 350, 243);

  let rowY = 260;
  config.tableData.forEach((row, index) => {
    if (index % 2 === 1) {
      doc.rect(50, rowY, 495.28, 25).fill('#F8FAFC');
    } else {
      doc.rect(50, rowY, 495.28, 25).fill('#FFFFFF');
    }
    doc.fillColor('#1E293B').fontSize(9).font('Helvetica').text(row.year, 65, rowY + 8);
    doc.text(row.total, 180, rowY + 8);
    doc.fillColor(config.accentColor).font('Helvetica-Bold').text(row.debtShare, 350, rowY + 8);
    rowY += 25;
  });

  doc.rect(50, 400, 495.28, 65).fill('#FFFBEB').strokeColor('#FEF3C7').lineWidth(1).stroke();
  doc.fillColor('#92400E').fontSize(9.5).font('Helvetica-Oblique').text(config.calloutText, 70, 415, { width: 455, lineGap: 4 });

  // ==========================================
  // PAGE 4: FUTURE OUTLOOK
  // ==========================================
  doc.addPage();

  doc.fillColor('#64748B').fontSize(8).font('Helvetica-Bold').text('FOUNDEXAI MARKET INTELLIGENCE REPORT  |  ECOSYSTEM TRENDS', 50, 40);
  doc.moveTo(50, 52).lineTo(545.28, 52).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

  doc.fillColor('#0F172A').fontSize(22).font('Helvetica-Bold').text(config.secTitle3, 50, 80);
  doc.rect(50, 110, 40, 3).fill(config.accentColor);

  const outlookText1 = `Industry analysts forecast structured clearing corridors will see massive growth over the next five years. We anticipate the introduction of tailored regional facilities and collaborative funding pools, driving friction out of B2B transactions.`;
  const outlookText2 = `For ecosystem stakeholders, balancing early stage equity investments with sustainable capital options provides the highest returns. Building matching working capital reserves yields greater runway security, scaling regional capabilities.`;

  doc.fillColor('#334155').fontSize(11).font('Helvetica').text(outlookText1, 50, 130, { width: 495.28, lineGap: 6 });
  doc.text(outlookText2, 50, 200, { width: 495.28, lineGap: 6 });

  doc.fillColor('#0F172A').fontSize(14).font('Helvetica-Bold').text('Foundex Recommendations for Growth Operators', 50, 295);

  const recList = [
    "Verify Flow-to-Yield: Verify asset-backed transactions match regional cashflow timelines.",
    "Evaluate FX Buffers: Maintain capital buffers against currency corridors to prevent inflation leakage.",
    "Utilize Mixed Facilities: Blend strategic early capital structures with seasonal revolving facilities."
  ];

  let recY = 325;
  recList.forEach(rec => {
    doc.rect(50, recY + 3, 5, 5).fill('#0F172A');
    doc.fillColor('#334155').fontSize(10).font('Helvetica').text(rec, 65, recY, { width: 480, lineGap: 4 });
    recY += 45;
  });

  doc.rect(50, 500, 495.28, 120).fill('#0B0F19').stroke();
  doc.fillColor('#F8FAFC').fontSize(12).font('Helvetica-Bold').text('FOUNDEXAI ECOSYSTEM INSIGHTS', 70, 525);
  doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text(`This intelligence report is compiled from verified transaction disclosures, proprietary database records, and secondary research methods. For customized sectoral surveys or specialized data access, contact us at advisory@foundex.ai.`, 70, 545, { width: 455, lineGap: 4 });

  // Page Numbers
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    if (i === 0) continue;
    doc.fillColor('#94A3B8')
       .fontSize(9)
       .font('Helvetica')
       .text(`Page ${i + 1} of ${pages.count}`, 50, 785, { align: 'right', width: 495.28 });
       
    doc.text('© 2026 FoundexAI Research. All Rights Reserved.', 50, 785, { align: 'left', width: 495.28 });
  }

  doc.end();

  writeStream.on('finish', () => {
    console.log(`Generated: ${config.filename}`);
  });
  writeStream.on('error', (err) => {
    console.error(`Failed: ${config.filename}`, err);
  });
}

// Generate all 9 reports
REPORTS_CONFIG.forEach(config => {
  generateReport(config);
});
