const { TSqlinatorFormatter } = require('./out/tSqlinatorFormatter.js');

// Test the exact problematic sequence
const problemSQL = `DECLARE db_cursor CURSOR FOR
SELECT DISTINCT Name
FROM #Organization

OPEN db_cursor
FETCH NEXT FROM db_cursor INTO @ColumnName1

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @Id += 1
    FETCH NEXT FROM db_cursor INTO @ColumnName1
END

CLOSE db_cursor
DEALLOCATE db_cursor`;

console.log('🔍 Investigating the exact problem');
console.log('\nInput SQL:');
console.log(problemSQL);

console.log('\nExpected output:');
console.log('- DECLARE db_cursor CURSOR FOR');
console.log('- SELECT DISTINCT Name');  
console.log('- FROM #Organization');
console.log('- OPEN db_cursor');
console.log('- FETCH NEXT FROM db_cursor INTO @ColumnName1');

const formatter = new TSqlinatorFormatter({
    useRiverFormatting: false,
    useIndentFormatting: false
});

console.log('\nActual output:');
const result = formatter.format(problemSQL);
console.log(result);

console.log('\nAnalysis:');
const lines = result.split('\n').filter(line => line.trim());
lines.forEach((line, index) => {
    console.log(`${index + 1}. "${line.trim()}"`);
});

// The issue is that FETCH NEXT FROM is being merged into the SELECT FROM clause
// This suggests that the statement parsing is not correctly identifying where the cursor declaration ends