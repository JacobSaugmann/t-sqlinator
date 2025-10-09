const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');
const fs = require('fs');

console.log('🧪 Testing Comments_test.sql with new logic...\n');

const formatter = new TSqlinatorFormatter();

// Read the test file
const testSql = fs.readFileSync('Comments_test.sql', 'utf8');

console.log('Input SQL (first 500 chars):');
console.log('─'.repeat(50));
console.log(testSql.substring(0, 500) + '...');
console.log('\n' + '─'.repeat(50));

console.log('\nFormatted SQL:');
console.log('─'.repeat(50));
const result = formatter.format(testSql);
console.log(result);
console.log('─'.repeat(50));

// Count blank lines around comments
const lines = result.split('\n');
let commentsWithExtraLines = 0;
let totalComments = 0;

lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('-- ') && !trimmed.includes('Unik ID') && !trimmed.includes('Dokumentnavn')) {
        totalComments++;
        const prevLine = lines[index - 1] || '';
        const nextLine = lines[index + 1] || '';
        
        if (prevLine.trim() === '' || nextLine.trim() === '') {
            commentsWithExtraLines++;
            console.log(`\nComment with spacing: "${trimmed}"`);
            console.log(`Previous: "${prevLine}"`);
            console.log(`Next: "${nextLine}"`);
        }
    }
});

console.log(`\n📊 Analysis: ${commentsWithExtraLines}/${totalComments} comments have extra spacing`);