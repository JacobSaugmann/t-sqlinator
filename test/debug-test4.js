const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🔍 Debugging Test 4 - Multi-column with inline comments\n');

const testSQL = `SELECT
    wf.CASEID,      -- Primary key comment
    wf.DOCUMENT,    -- Document reference
    wf.STATUS       -- Current status`;

console.log('Original SQL:');
console.log(testSQL);

const formatter = new TSqlinatorFormatter();
const result = formatter.format(testSQL);

console.log('\nFormatted result:');
console.log(result);

console.log('\nFormatted result (escaped):');
console.log(JSON.stringify(result));

// Test individual columns
const columns = [
    'wf.CASEID,      -- Primary key comment',
    'wf.DOCUMENT,    -- Document reference', 
    'wf.STATUS       -- Current status'
];

columns.forEach((col, index) => {
    console.log(`\n--- Testing column ${index + 1}: ${col} ---`);
    const singleResult = formatter.format(`SELECT ${col}`);
    console.log('Result:');
    console.log(singleResult);
});
