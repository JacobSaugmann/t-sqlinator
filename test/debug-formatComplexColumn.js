const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🔍 Testing formatComplexColumn directly\n');

const formatter = new TSqlinatorFormatter();

// We need to access the private method indirectly
// Let's test specific scenarios manually

const testCases = [
    'wf.CASEID',
    'wf.CASEID -- comment',
    'COALESCE(wf.STEP_NAME, wf.WORKFLOW_GROUP) AS ACTION'
];

testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: "${testCase}"`);
    
    // Test with a simple SELECT to see what formatComplexColumn does
    const singleColumnSQL = `SELECT ${testCase}`;
    const result = formatter.format(singleColumnSQL);
    console.log('Full format result:');
    console.log(result);
});
