const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🔍 Tracing parseSelectColumns output\n');

const selectContent = `
    wf.CASEID,      -- Primary key comment
    wf.DOCUMENT,    -- Document reference  
    wf.STATUS       -- Current status`.trim();

console.log('Select content being parsed:');
console.log(`"${selectContent}"`);

// Create a test formatter to access its parseSelectColumns method
const formatter = new TSqlinatorFormatter();

// We can't directly call parseSelectColumns since it's private, 
// but we can simulate it exactly
console.log('\nStep-by-step parsing simulation:');

const columns = [];
let currentColumn = '';
let parenLevel = 0;
let inQuotes = false;
let quoteChar = '';

for (let i = 0; i < selectContent.length; i++) {
    const char = selectContent[i];

    // Handle quotes
    if (!inQuotes && (char === "'" || char === '"')) {
        inQuotes = true;
        quoteChar = char;
    } else if (inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
    }
    // Handle parentheses
    else if (!inQuotes && char === '(') {
        parenLevel++;
    } else if (!inQuotes && char === ')') {
        parenLevel--;
    }
    // Handle column separation
    else if (!inQuotes && char === ',' && parenLevel === 0) {
        console.log(`Found comma at position ${i}, currentColumn: "${currentColumn}"`);
        
        // Look ahead to see if there's a comment immediately after this comma
        let lookahead = i + 1;
        let afterComma = '';
        
        // Collect only whitespace and comment on the SAME line
        while (lookahead < selectContent.length && selectContent[lookahead] !== '\n') {
            afterComma += selectContent[lookahead];
            lookahead++;
        }
        
        console.log(`After comma: "${afterComma}"`);
        
        // If what follows the comma is only whitespace and a comment, include it
        const afterCommaTrimmed = afterComma.trim();
        if (afterCommaTrimmed.startsWith('--') || afterCommaTrimmed.startsWith('/*')) {
            // Include only this comment with the current column, then continue parsing
            currentColumn += ',' + afterComma;
            console.log(`Including comment, new currentColumn: "${currentColumn}"`);
            i = lookahead - 1; // Position at end of line, next iteration will handle newline
        } else {
            // Normal column split
            if (currentColumn.trim()) {
                columns.push(currentColumn.trim());
                console.log(`Added column: "${currentColumn.trim()}"`);
            }
            currentColumn = '';
        }
        continue;
    }

    currentColumn += char;
}

if (currentColumn.trim()) {
    columns.push(currentColumn.trim());
    console.log(`Final column: "${currentColumn.trim()}"`);
}

console.log('\nFinal parsed columns:');
columns.forEach((col, index) => {
    console.log(`  ${index + 1}: "${col}"`);
});
