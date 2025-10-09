const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🔍 Progressive Comment Testing\n');

// Test increasingly complex scenarios
const testCases = [
    {
        name: "Single column with inline comment",
        sql: "SELECT wf.CASEID -- comment"
    },
    {
        name: "Single column with comma and inline comment",
        sql: "SELECT wf.CASEID, -- comment"
    },
    {
        name: "Two columns simple",
        sql: "SELECT wf.CASEID, wf.DOCUMENT"
    },
    {
        name: "Two columns - first with inline comment",
        sql: "SELECT wf.CASEID, -- comment\nwf.DOCUMENT"
    },
    {
        name: "Two columns - both with inline comments",
        sql: "SELECT wf.CASEID, -- comment1\nwf.DOCUMENT -- comment2"
    },
    {
        name: "Multi-line formatted with comments",
        sql: `SELECT
    wf.CASEID,     -- comment1
    wf.DOCUMENT    -- comment2`
    }
];

const formatter = new TSqlinatorFormatter();

testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log('Input:');
    console.log(testCase.sql);
    
    const formatted = formatter.format(testCase.sql);
    console.log('Output:');
    console.log(formatted);
    console.log('=' .repeat(60));
});
