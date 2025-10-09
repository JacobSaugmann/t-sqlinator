const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🔍 Debugging formatSelectLegacy behavior\n');

// Test the specific case that's failing
const testColumns = [
    'wf.CASEID,      -- Primary key comment',
    'wf.DOCUMENT,    -- Document reference',
    'wf.STATUS       -- Current status'
];

console.log('Input columns:');
testColumns.forEach((col, index) => {
    console.log(`  ${index + 1}: "${col}"`);
});

const formatter = new TSqlinatorFormatter();

console.log('\nTesting formatComplexColumn on each individual column:');
testColumns.forEach((col, index) => {
    const formatted = formatter.formatComplexColumn(col);
    console.log(`  Column ${index + 1}: "${col}" -> "${formatted}"`);
});

console.log('\nTesting full SELECT formatting:');
const selectSQL = `SELECT
    wf.CASEID,      -- Primary key comment
    wf.DOCUMENT,    -- Document reference
    wf.STATUS       -- Current status`;

const result = formatter.format(selectSQL);
console.log('Result:');
console.log(result);

console.log('\nResult lines:');
result.split('\n').forEach((line, index) => {
    console.log(`  ${index + 1}: "${line}"`);
});
