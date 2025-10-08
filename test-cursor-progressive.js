const { TSqlinatorFormatter } = require('./out/tSqlinatorFormatter.js');

// Test the cursor script in progressive chunks to find where it breaks
const tests = [
    {
        name: "Just cursor declaration",
        sql: `DECLARE db_cursor CURSOR FOR
SELECT DISTINCT Name
FROM #Organization`
    },
    {
        name: "Declaration + OPEN",
        sql: `DECLARE db_cursor CURSOR FOR
SELECT DISTINCT Name
FROM #Organization

OPEN db_cursor`
    },
    {
        name: "Declaration + OPEN + FETCH",
        sql: `DECLARE db_cursor CURSOR FOR
SELECT DISTINCT Name
FROM #Organization

OPEN db_cursor
FETCH NEXT FROM db_cursor INTO @ColumnName1`
    },
    {
        name: "Declaration + OPEN + FETCH + WHILE start",
        sql: `DECLARE db_cursor CURSOR FOR
SELECT DISTINCT Name
FROM #Organization

OPEN db_cursor
FETCH NEXT FROM db_cursor INTO @ColumnName1

WHILE @@FETCH_STATUS = 0
BEGIN`
    }
];

console.log('🧪 Progressive Cursor Testing');

const formatter = new TSqlinatorFormatter({
    useRiverFormatting: false,
    useIndentFormatting: false
});

tests.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log('Input:');
    console.log(test.sql);
    console.log('\nOutput:');
    const result = formatter.format(test.sql);
    console.log(result);
    
    // Check for missing OPEN and FETCH keywords
    const hasOpen = result.toUpperCase().includes('OPEN');
    const hasFetch = result.toUpperCase().includes('FETCH');
    const hasOrganization = result.includes('#Organization');
    
    console.log(`Status: ${hasOpen ? '✅' : '❌'} OPEN, ${hasFetch ? '✅' : '❌'} FETCH, ${hasOrganization ? '✅' : '❌'} #Organization`);
    console.log('='.repeat(60));
});