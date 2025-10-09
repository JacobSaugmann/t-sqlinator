const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🔍 Debugging parseSelectColumns behavior\n');

const selectContent = `wf.CASEID,      -- Primary key comment
    wf.DOCUMENT,    -- Document reference
    wf.STATUS       -- Current status`;

console.log('Select content to parse:');
console.log(`"${selectContent}"`);

console.log('\nManual simulation of parseSelectColumns:');

const columns = [];
let currentColumn = '';
let parenLevel = 0;
let inQuotes = false;
let quoteChar = '';

// Simulate hasInlineComment function
function hasInlineComment(line) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('--') || trimmedLine.startsWith('/*')) {
        return false;
    }
    const lineCommentIndex = line.indexOf('--');
    if (lineCommentIndex > 0) {
        const beforeComment = line.substring(0, lineCommentIndex);
        const singleQuotes = (beforeComment.match(/'/g) || []).length;
        const doubleQuotes = (beforeComment.match(/"/g) || []).length;
        return singleQuotes % 2 === 0 && doubleQuotes % 2 === 0;
    }
    const blockCommentStart = line.indexOf('/*');
    if (blockCommentStart > 0 && line.includes('*/')) {
        const beforeComment = line.substring(0, blockCommentStart);
        const singleQuotes = (beforeComment.match(/'/g) || []).length;
        const doubleQuotes = (beforeComment.match(/"/g) || []).length;
        return singleQuotes % 2 === 0 && doubleQuotes % 2 === 0;
    }
    return false;
}

for (let i = 0; i < selectContent.length; i++) {
    const char = selectContent[i];
    
    if (char === ',' && parenLevel === 0 && !inQuotes) {
        console.log(`\nFound comma at position ${i}`);
        console.log(`Current column so far: "${currentColumn}"`);
        
        // Look ahead
        let lookahead = i + 1;
        let afterComma = '';
        while (lookahead < selectContent.length && selectContent[lookahead] !== '\n') {
            afterComma += selectContent[lookahead];
            lookahead++;
        }
        
        const afterCommaTrimmed = afterComma.trim();
        console.log(`After comma: "${afterComma}"`);
        console.log(`After comma trimmed: "${afterCommaTrimmed}"`);
        console.log(`Starts with comment: ${afterCommaTrimmed.startsWith('--') || afterCommaTrimmed.startsWith('/*')}`);
        
        if (afterCommaTrimmed.startsWith('--') || afterCommaTrimmed.startsWith('/*')) {
            console.log(`  -> Including comment with current column`);
            currentColumn += ',' + afterComma;
            i = lookahead - 1;
        } else {
            console.log(`  -> Checking if current column has inline comment`);
            const hasInline = hasInlineComment(currentColumn);
            console.log(`  -> Current column has inline comment: ${hasInline}`);
            
            if (hasInline) {
                console.log(`  -> Keeping comma with column (inline comment present)`);
                currentColumn += char;
            } else {
                console.log(`  -> Normal split (no inline comment)`);
                if (currentColumn.trim()) {
                    columns.push(currentColumn.trim());
                    console.log(`  -> Added column: "${currentColumn.trim()}"`);
                }
                currentColumn = '';
            }
        }
        continue;
    }
    
    currentColumn += char;
}

if (currentColumn.trim()) {
    columns.push(currentColumn.trim());
    console.log(`\nFinal column: "${currentColumn.trim()}"`);
}

console.log('\nParsed columns:');
columns.forEach((col, index) => {
    console.log(`  ${index + 1}: "${col}"`);
});
