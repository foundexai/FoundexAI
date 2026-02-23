const XLSX = require('xlsx');
const fs = require('fs');

const workbook = XLSX.readFile('/Users/mac/Desktop/personal/foundex-mvp/public/Foundex Opportunities vA [CONFIDENTIAL].xlsx');

const investors = [];

function parseVCSheet(name, type) {
    const sheet = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // Headers are in Row 2 (index 1)
    // Data starts from Row 3 (index 2)
    for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (!row[1]) continue; // Skip if no name

        const focusRaw = row[7] ? String(row[7]) : "";
        const focus = focusRaw.split(/[,/]/).map(s => s.trim()).filter(Boolean);

        investors.push({
            name: String(row[1]).trim(),
            location: row[2] ? String(row[2]).trim() : "Global",
            description: row[3] ? String(row[3]).trim() : "No description provided.",
            website: row[4] ? String(row[4]).trim() : "",
            stage: row[5] ? String(row[5]).trim() : "",
            thesis: row[6] ? String(row[6]).trim() : "",
            focus: focus,
            active_status: row[8] ? String(row[8]).trim() : "Active",
            hq_country: row[9] ? String(row[9]).trim() : "",
            investmentRange: row[10] ? String(row[10]).trim() : "",
            notes: row[11] ? String(row[11]).trim() : "",
            linkedin: row[12] ? String(row[12]).trim() : "",
            email: row[13] ? String(row[13]).trim() : "",
            type: type
        });
    }
}

function parseGrantsSheet() {
    const sheet = workbook.Sheets["Grants"];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    for (let i = 2; i < data.length; i++) {
        const row = data[i];
        if (!row[1]) continue;

        const focusRaw = row[6] ? String(row[6]) : "";
        const focus = focusRaw.split(/[,/]/).map(s => s.trim()).filter(Boolean);

        investors.push({
            name: String(row[1]).trim(),
            location: row[7] ? String(row[7]).trim() : "Africa",
            description: (row[2] ? String(row[2]) + ": " : "") + (row[3] ? String(row[3]) : ""),
            website: row[14] ? String(row[14]).trim() : "",
            investmentRange: row[4] ? String(row[4]).trim() : "",
            thesis: row[5] ? String(row[5]).trim() : "Grant Eligibility",
            focus: focus,
            active_status: (row[12] === "Yes" || row[12] === true) ? "Active" : "Active",
            notes: row[15] ? String(row[15]).trim() : "",
            linkedin: row[16] ? String(row[16]).trim() : "",
            type: "Grant"
        });
    }
}

parseVCSheet("Global VCs", "VC");
parseVCSheet("Silicon_Valley_VCs", "VC");
parseGrantsSheet();

const tsContent = `export const largeInvestorData = ${JSON.stringify(investors, null, 2)};`;
fs.writeFileSync('/Users/mac/Desktop/personal/foundex-mvp/lib/seeds/investorData.ts', tsContent);
console.log(`Extracted ${investors.length} investors.`);
