const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🔍 Debugging hasCodeBeforeComment\n');

// Test cases
const testCases = [
    'wf.CASEID -- Unik ID for workflow-case',
    'wf.CASEID, -- Unik ID for workflow-case',
    'wf.CASEID,     -- Unik ID for workflow-case',
    'wf.DOCUMENT    -- Dokumentnavn eller reference',
    '-- Standalone comment',
    'COALESCE(wf.STEP_NAME, wf.WORKFLOW_GROUP) AS ACTION,  -- Navn på trin eller gruppe'
];

// Simulate hasCodeBeforeComment function
function hasCodeBeforeComment(line) {
    const commentIndex = line.indexOf('--');
    if (commentIndex === -1) return false;
    
    const beforeComment = line.substring(0, commentIndex).trim();
    return beforeComment.length > 0;
}

testCases.forEach((testCase, index) => {
    const result = hasCodeBeforeComment(testCase);
    console.log(`Test ${index + 1}: "${testCase}"`);
    console.log(`  Has code before comment: ${result}`);
    
    if (result) {
        const commentIndex = testCase.indexOf('--');
        const codeBeforeComment = testCase.substring(0, commentIndex).trim();
        const comment = testCase.substring(commentIndex);
        console.log(`  Code part: "${codeBeforeComment}"`);
        console.log(`  Comment part: "${comment}"`);
        
        // Remove trailing comma
        const cleanCode = codeBeforeComment.replace(/,\s*$/, '').trim();
        console.log(`  Clean code: "${cleanCode}"`);
    }
    console.log();
});

console.log('🧪 Testing full SQL formatting:');
const sql = `SELECT
    wf.CASEID,     -- Unik ID for workflow-case
    wf.DOCUMENT    -- Dokumentnavn eller reference`;

const formatter = new TSqlinatorFormatter();
const formatted = formatter.format(sql);
console.log(formatted);
