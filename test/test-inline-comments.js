const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter.js');

// Test inline comment handling specifically
const testCases = [
    {
        name: "Simple column with inline comment",
        sql: "SELECT wf.CASEID -- Unik ID for workflow-case"
    },
    {
        name: "Two columns with inline comments",
        sql: `SELECT 
    wf.CASEID,     -- Unik ID for workflow-case
    wf.DOCUMENT    -- Dokumentnavn eller reference`
    },
    {
        name: "Full standalone comment block",
        sql: `/* Dette script demonstrerer en kompleks forespørgsel */

SELECT wf.CASEID`
    },
    {
        name: "Mixed inline and standalone",
        sql: `/* Block comment */

SELECT 
    wf.CASEID,     -- Inline comment 1
    wf.DOCUMENT    -- Inline comment 2

-- Standalone line comment
FROM #WORKFLOW AS wf`
    }
];

const formatter = new TSqlinatorFormatter({
    useRiverFormatting: false,
    useIndentFormatting: false
});

console.log('🧪 Testing Inline Comment Handling');

testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}`);
    console.log('Input:');
    console.log(testCase.sql);
    console.log('\nOutput:');
    const result = formatter.format(testCase.sql);
    console.log(result);
    console.log('='.repeat(60));
});
