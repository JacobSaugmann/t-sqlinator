const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🧪 Testing Danish comment issue...\n');

const formatter = new TSqlinatorFormatter();

const testSql = `SELECT 
    wf.CASEID,
    wf.DOCUMENT,
    -- Gruppér efter type baseret på trackingtype og tilstedeværelse af bruger
    CASE
        WHEN wf.TRACKINGTYPE = 36 THEN 'Automatik'
        WHEN wf.TRACKINGTYPE IN (10, 4) THEN 'Person'
        WHEN usr.NAME IS NOT NULL THEN 'Person'
        ELSE 'System'
    END AS GROUPING
FROM #WORKFLOW AS wf`;

console.log('Input SQL:');
console.log('─'.repeat(50));
console.log(testSql);
console.log('\n' + '─'.repeat(50));

console.log('\nFormatted SQL:');
console.log('─'.repeat(50));
const result = formatter.format(testSql);
console.log(result);
console.log('─'.repeat(50));

console.log('\nAnalysis:');
const lines = result.split('\n');
lines.forEach((line, index) => {
    if (line.includes('Gruppér')) {
        console.log(`Line ${index + 1}: "${line}"`);
        console.log(`Previous line: "${lines[index - 1] || 'N/A'}"`);
        console.log(`Next line: "${lines[index + 1] || 'N/A'}"`);
    }
});