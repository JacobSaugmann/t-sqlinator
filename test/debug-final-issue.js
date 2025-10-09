const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🔍 Final debugging attempt\n');

// Test the exact case that's failing
const problematicSQL = `SELECT
    wf.CASEID,     -- Unik ID for workflow-case
    wf.DOCUMENT    -- Dokumentnavn eller reference`;

console.log('Input:');
console.log(problematicSQL);

const formatter = new TSqlinatorFormatter();
const result = formatter.format(problematicSQL);

console.log('\nOutput:');
console.log(result);

// What we WANT to see:
console.log('\nDESIRED output:');
console.log(`SELECT
      wf.CASEID,     -- Unik ID for workflow-case
    , wf.DOCUMENT    -- Dokumentnavn eller reference`);

// The issue: The first column's comment is being separated from the column
