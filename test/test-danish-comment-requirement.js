const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🧪 Testing Danish comment requirement specifically...\n');

const formatter = new TSqlinatorFormatter();

// Test case 1: Danish comment in SELECT statement should stay inline
const testCase1 = `SELECT 
    wf.CASEID,
    wf.DOCUMENT,
    -- Gruppér efter type baseret på trackingtype og tilstedeværelse af bruger
    CASE
        WHEN wf.TRACKINGTYPE = 36 THEN 'Automatik'
        ELSE 'System'
    END AS GROUPING
FROM table1`;

// Test case 2: Truly standalone comment should get spacing
const testCase2 = `-- This is a standalone comment at the top

SELECT wf.CASEID
FROM table1`;

// Test case 3: Comment in middle of WHERE clause
const testCase3 = `SELECT wf.CASEID
FROM table1
WHERE wf.STATUS = 'Active'
    -- Filter only active records based on business rules
    AND wf.DELETED = 0`;

function testCommentHandling(testSql, testName, expectInline) {
    console.log(`📋 ${testName}:`);
    console.log('Input:');
    console.log(testSql);
    console.log('\nFormatted:');
    const result = formatter.format(testSql);
    console.log(result);
    
    // Check for blank lines around the comment
    const lines = result.split('\n');
    let commentLineIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Gruppér') || lines[i].includes('standalone comment') || lines[i].includes('Filter only')) {
            commentLineIndex = i;
            break;
        }
    }
    
    if (commentLineIndex >= 0) {
        const prevLine = lines[commentLineIndex - 1] || '';
        const nextLine = lines[commentLineIndex + 1] || '';
        const hasBlankLineBefore = prevLine.trim() === '';
        const hasBlankLineAfter = nextLine.trim() === '';
        
        if (expectInline) {
            const success = !hasBlankLineBefore && !hasBlankLineAfter;
            console.log(`Expected: Inline (no blank lines) - ${success ? '✅ PASSED' : '❌ FAILED'}`);
            if (!success) {
                console.log(`  Blank before: ${hasBlankLineBefore}, Blank after: ${hasBlankLineAfter}`);
            }
        } else {
            const success = hasBlankLineBefore || hasBlankLineAfter;
            console.log(`Expected: Standalone (with spacing) - ${success ? '✅ PASSED' : '❌ FAILED'}`);
            if (!success) {
                console.log(`  No spacing detected around comment`);
            }
        }
    } else {
        console.log('❌ Comment not found in output');
    }
    
    console.log('─'.repeat(60));
    return true;
}

// Run tests
testCommentHandling(testCase1, 'Danish comment in SELECT statement', true);
testCommentHandling(testCase2, 'Truly standalone comment', false);
testCommentHandling(testCase3, 'Comment in WHERE clause', true);

console.log('\n🎯 Danish comment requirement test completed!');