const mongoose = require('mongoose');

async function evaluate() {
  await mongoose.connect('mongodb://localhost:27017/neet-engine');
  
  // Define Schemas
  const CollegeSchema = new mongoose.Schema({}, { strict: false, collection: 'colleges' });
  const CutoffSchema = new mongoose.Schema({}, { strict: false, collection: 'cutoffs' });
  
  const College = mongoose.models.College || mongoose.model('College', CollegeSchema);
  const Cutoff = mongoose.models.Cutoff || mongoose.model('Cutoff', CutoffSchema);

  // Test Case 1: High Ranker (Rank 100, Category UR)
  console.log('--- TEST CASE 1: Rank 100, UR ---');
  let cutoffs1 = await Cutoff.find({ closingRank: { $gte: 100 }, category: 'UR' }).populate('collegeId').sort({ closingRank: 1 }).limit(5).lean();
  let results1 = [];
  for (let c of cutoffs1) {
    let col = await College.findById(c.collegeId).lean();
    results1.push(`${col.name} (${c.quota}) - Cutoff: ${c.closingRank}`);
  }
  console.log(results1.join('\n'));

  // Test Case 2: Mid Ranker (Rank 1200, Category UR)
  console.log('\n--- TEST CASE 2: Rank 1200, UR ---');
  let cutoffs2 = await Cutoff.find({ closingRank: { $gte: 1200 }, category: 'UR' }).populate('collegeId').sort({ closingRank: 1 }).limit(5).lean();
  let results2 = [];
  for (let c of cutoffs2) {
    let col = await College.findById(c.collegeId).lean();
    results2.push(`${col.name} (${c.quota}) - Cutoff: ${c.closingRank}`);
  }
  console.log(results2.join('\n'));

  // Test Case 3: Category Ranker (Rank 15000, Category SC)
  console.log('\n--- TEST CASE 3: Rank 15000, SC ---');
  let cutoffs3 = await Cutoff.find({ closingRank: { $gte: 15000 }, category: 'SC' }).populate('collegeId').sort({ closingRank: 1 }).limit(5).lean();
  let results3 = [];
  for (let c of cutoffs3) {
    let col = await College.findById(c.collegeId).lean();
    results3.push(`${col.name} (${c.quota}) - Cutoff: ${c.closingRank}`);
  }
  console.log(results3.join('\n'));

  process.exit(0);
}

evaluate().catch(console.error);
