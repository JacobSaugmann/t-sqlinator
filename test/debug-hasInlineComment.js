const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🔍 Debugging hasInlineComment detection\n');

// Test the hasInlineComment function manually
const testColumns = [
    'wf.CASEID,      -- Primary key comment',
    'wf.DOCUMENT,    -- Document reference', 
    'wf.STATUS       -- Current status'
];

// Simulate the hasInlineComment logic manually
testColumns.forEach((col, index) => {
    console.log(`Column ${index + 1}: "${col}"`);
    
    const trimmedLine = col.trim();
    console.log(`  Trimmed: "${trimmedLine}"`);
    
    // Check if starts with comment
    const startsWithComment = trimmedLine.startsWith('--') || trimmedLine.startsWith('/*');
    console.log(`  Starts with comment: ${startsWithComment}`);
    
    if (!startsWithComment) {
        // Check for inline -- comment
        const lineCommentIndex = col.indexOf('--');
        console.log(`  Line comment index: ${lineCommentIndex}`);
        
        if (lineCommentIndex > 0) {
            const beforeComment = col.substring(0, lineCommentIndex);
            console.log(`  Before comment: "${beforeComment}"`);
            
            const singleQuotes = (beforeComment.match(/'/g) || []).length;
            const doubleQuotes = (beforeComment.match(/"/g) || []).length;
            console.log(`  Single quotes: ${singleQuotes}, Double quotes: ${doubleQuotes}`);
            
            const hasInlineComment = singleQuotes % 2 === 0 && doubleQuotes % 2 === 0;
            console.log(`  Has inline comment: ${hasInlineComment}`);
        } else {
            console.log(`  No inline -- comment found`);
        }
        
        // Check for block comments too
        const blockCommentStart = col.indexOf('/*');
        if (blockCommentStart > 0 && col.includes('*/')) {
            console.log(`  Has inline block comment`);
        }
    }
    
    console.log('');
});
