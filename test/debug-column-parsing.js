const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🔍 Debugging Column Parsing\n');

const testSQL = `SELECT
    wf.CASEID,     -- Unik ID for workflow-case
    wf.DOCUMENT    -- Dokumentnavn eller reference`;

console.log('Original SQL:');
console.log(testSQL);

const formatter = new TSqlinatorFormatter();

// Let's debug the parseSelectColumns method directly
const selectContent = `
    wf.CASEID,     -- Unik ID for workflow-case
    wf.DOCUMENT    -- Dokumentnavn eller reference`.trim();

console.log('\n📋 Debug: Raw SELECT content to parse:');
console.log(`"${selectContent}"`);

// Let's add a debug method to see what columns are parsed
console.log('\n🔧 Manual column parsing test:');

// Simulate the parseSelectColumns logic to see what happens
const columns = [];
let currentColumn = '';
let parenLevel = 0;
let inQuotes = false;
let quoteChar = '';
let inLineComment = false;
let inBlockComment = false;

for (let i = 0; i < selectContent.length; i++) {
    const char = selectContent[i];
    const nextChar = i < selectContent.length - 1 ? selectContent[i + 1] : '';

    // Handle quotes
    if (!inLineComment && !inBlockComment && !inQuotes && (char === "'" || char === '"')) {
        inQuotes = true;
        quoteChar = char;
    } else if (!inLineComment && !inBlockComment && inQuotes && char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
    }
    // Handle line comments
    else if (!inQuotes && !inBlockComment && char === '-' && nextChar === '-') {
        inLineComment = true;
    } else if (inLineComment && char === '\n') {
        inLineComment = false;
    }
    // Handle block comments
    else if (!inQuotes && !inLineComment && char === '/' && nextChar === '*') {
        inBlockComment = true;
    } else if (inBlockComment && char === '*' && nextChar === '/') {
        inBlockComment = false;
        currentColumn += char + nextChar;
        i++;
        continue;
    }
    // Handle parentheses
    else if (!inQuotes && !inLineComment && !inBlockComment && char === '(') {
        parenLevel++;
    } else if (!inQuotes && !inLineComment && !inBlockComment && char === ')') {
        parenLevel--;
    }
    // Handle column separation
    else if (!inQuotes && !inLineComment && !inBlockComment && char === ',' && parenLevel === 0) {
        if (currentColumn.trim()) {
            columns.push(currentColumn.trim());
        }
        console.log(`   Found column boundary at char ${i}: "${currentColumn.trim()}"`);
        currentColumn = '';
        continue;
    }

    currentColumn += char;
}

if (currentColumn.trim()) {
    columns.push(currentColumn.trim());
    console.log(`   Final column: "${currentColumn.trim()}"`);
}

console.log('\n📊 Parsed columns:');
columns.forEach((col, index) => {
    console.log(`   ${index + 1}: "${col}"`);
});

console.log('\n🎨 Full formatting result:');
const result = formatter.format(testSQL);
console.log(result);
