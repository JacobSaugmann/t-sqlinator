const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

const formatter = new TSqlinatorFormatter();

console.log('🧪 Testing extractInlineComment\n');

// Simulate what happens in formatSelectLegacy
const testColumn = "wf.CASEID,     -- Unik ID for workflow-case";

console.log('Input column:', testColumn);

// We need to simulate the extractInlineComment function
// Let's test with a manual implementation to understand the issue

function extractInlineComment(line) {
    let code = line;
    let comment = '';
    
    // Handle -- comments
    const lineCommentIndex = line.indexOf('--');
    if (lineCommentIndex > 0) {
        // Make sure it's not inside quotes
        const beforeComment = line.substring(0, lineCommentIndex);
        const singleQuotes = (beforeComment.match(/'/g) || []).length;
        const doubleQuotes = (beforeComment.match(/"/g) || []).length;
        
        // If we have an even number of quotes, the comment is not inside a string
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
            code = beforeComment.trimEnd();
            comment = line.substring(lineCommentIndex);
            return { code, comment };
        }
    }
    
    return { code, comment };
}

const result = extractInlineComment(testColumn);
console.log('Code part:', JSON.stringify(result.code));
console.log('Comment part:', JSON.stringify(result.comment));

// Now remove trailing comma as in the logic
const cleanColumn = result.code.trim().replace(/,\s*$/, '').trim();
console.log('Clean column:', JSON.stringify(cleanColumn));

console.log('\n🔧 Full formatting test:');
const fullSql = `SELECT
    wf.CASEID,     -- Unik ID for workflow-case
    wf.DOCUMENT    -- Dokumentnavn eller reference`;

const formatted = formatter.format(fullSql);
console.log(formatted);
