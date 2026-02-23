const mongoose = require('mongoose');

// Define Schema manually to avoid TS/Next issues
const InvestorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  // ... other fields don't matter for update
});

const Investor = mongoose.models.Investor || mongoose.model('Investor', InvestorSchema);

async function fix() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI missing");
    await mongoose.connect(mongoUri);
    console.log("Connected to DB");

    // Re-parse the excel data to find which names should be grants
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile('/Users/mac/Desktop/personal/foundex-mvp/public/Foundex Opportunities vA [CONFIDENTIAL].xlsx');
    const sheet = workbook.Sheets["Grants"];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    const grantNames = [];
    for (let i = 2; i < data.length; i++) {
        if (data[i][1]) grantNames.push(String(data[i][1]).trim());
    }

    console.log(`Found ${grantNames.length} grant names in Excel.`);

    const result = await Investor.updateMany(
      { name: { $in: grantNames } },
      { $set: { type: 'Grant' } }
    );

    console.log(`Updated ${result.modifiedCount} investors to type 'Grant'`);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

fix();
