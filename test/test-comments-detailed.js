const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🧪 Adding comment handling test to the test suite\n');

// Test case for inline comment preservation based on user requirement:
// "hvis kommentarer med -- eller /**/ ir inde i et select statement så skal der ikke laves linjeskift før og efter, 
// men hvis den står selvstændigt så bebehold nuværende formattering"

const commentTests = [
    {
        name: "Inline comments should stay on same line as code",
        sql: `SELECT
    wf.CASEID,     -- Unik ID for workflow-case
    wf.DOCUMENT    -- Dokumentnavn eller reference`,
        expectedPattern: /wf\.CASEID.*--.*Unik ID/,
        description: "The comment should stay with its code, not be separated"
    },
    {
        name: "Standalone comments should maintain spacing",
        sql: `-- This is a standalone comment
SELECT wf.CASEID`,
        expectedPattern: /-- This is a standalone comment[\s\S]*SELECT/,
        description: "Standalone comments should keep their formatting"
    },
    {
        name: "Mixed inline and standalone comments",
        sql: `/* Block comment */
SELECT
    wf.CASEID,     -- Inline comment
    wf.DOCUMENT
-- Standalone comment
FROM table1`,
        expectedPattern: /\/\* Block comment \*\/[\s\S]*wf\.CASEID.*--.*Inline comment[\s\S]*-- Standalone comment[\s\S]*FROM/,
        description: "Should handle mix of comment types correctly"
    },
    {
        name: "Multi-column SELECT with inline comments",
        sql: `SELECT
    wf.CASEID,      -- Primary key comment
    wf.DOCUMENT,    -- Document reference
    wf.STATUS       -- Current status`,
        expectedPattern: /wf\.CASEID.*--.*PRIMARY KEY[\s\S]*wf\.DOCUMENT.*--.*Document reference/,
        description: "All inline comments should stay with their respective columns"
    },
    {
        name: "Block comments inline",
        sql: `SELECT
    wf.CASEID /* primary key */,
    wf.DOCUMENT /* doc ref */`,
        expectedPattern: /wf\.CASEID.*\/\*.*PRIMARY KEY.*\*\/[\s\S]*wf\.DOCUMENT.*\/\*.*doc ref.*\*\//,
        description: "Block comments should also stay inline"
    }
];

const formatter = new TSqlinatorFormatter();

console.log('📋 Testing comment handling requirements:\n');

let passedTests = 0;
let totalTests = commentTests.length;

commentTests.forEach((test, index) => {
    console.log(`${index + 1}. ${test.name}`);
    console.log(`   Input: ${test.sql.replace(/\n/g, '\\n')}`);
    
    const result = formatter.format(test.sql);
    console.log(`   Output: ${result.replace(/\n/g, '\\n')}`);
    
    const passed = test.expectedPattern.test(result);
    console.log(`   Expected: ${test.description}`);
    console.log(`   Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (passed) {
        passedTests++;
    }
    
    console.log('────────────────────────────────────────────────────────────\n');
});

console.log(`📊 Comment Handling Test Summary:`);
console.log(`   Passed: ${passedTests}/${totalTests}`);
console.log(`   Success rate: ${(passedTests/totalTests*100).toFixed(1)}%`);

if (passedTests === totalTests) {
    console.log(`🎉 ALL COMMENT TESTS PASSED!`);
} else {
    console.log(`❌ Comment handling needs implementation`);
    console.log(`📝 Priority: Implement inline comment preservation for SELECT statements`);
}
