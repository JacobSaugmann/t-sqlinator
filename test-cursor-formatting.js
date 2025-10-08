const { TSqlinatorFormatter } = require('./out/tSqlinatorFormatter.js');

// Original cursor from Cursor_example.sql
const cursorSQL = `-- Declare a cursor for a Table or a View 'TableOrViewName' in schema 'dbo'
DECLARE @ColumnName1 NVARCHAR(50), @Id INT = 1

DECLARE db_cursor CURSOR FOR
SELECT DISTINCT Name
FROM #Organization

OPEN db_cursor
FETCH NEXT FROM db_cursor INTO @ColumnName1

WHILE @@FETCH_STATUS = 0
BEGIN
    -- add instructions to be executed for every row
    INSERT INTO #OrgName (Id, Name, ParentName, Code, HierLevel)
    SELECT @Id,o.Name, O.ParentName, O.OrganizationCode, O.HierLevel
    FROM #Organization AS o
        CROSS APPLY #Organization AS oo
    WHERE oo.HierPath LIKE o.HierPath + '%'
    AND oo.Name = @ColumnName1
    EXCEPT
    SELECT Id, Name, ParentName, Code, HierLevel
    FROM #OrgName

    SET @Id += 1
    FETCH NEXT FROM db_cursor INTO @ColumnName1
END

CLOSE db_cursor
DEALLOCATE db_cursor`;

console.log('🧪 Testing Cursor Formatting Issues');
console.log('\n📝 Original cursor SQL:');
console.log(cursorSQL);

// Test Legacy formatting
console.log('\n==================================================');
console.log('📋 Legacy Formatting:');
console.log('==================================================');
const legacyFormatter = new TSqlinatorFormatter({
    useRiverFormatting: false,
    useIndentFormatting: false
});
const legacyResult = legacyFormatter.format(cursorSQL);
console.log(legacyResult);

// Test River formatting
console.log('\n==================================================');
console.log('📋 River Formatting:');
console.log('==================================================');
const riverFormatter = new TSqlinatorFormatter({
    useRiverFormatting: true,
    riverColumn: 7
});
const riverResult = riverFormatter.format(cursorSQL);
console.log(riverResult);

// Test Indent formatting
console.log('\n==================================================');
console.log('📋 Indent Formatting:');
console.log('==================================================');
const indentFormatter = new TSqlinatorFormatter({
    useRiverFormatting: false,
    useIndentFormatting: true
});
const indentResult = indentFormatter.format(cursorSQL);
console.log(indentResult);

// Check for specific cursor keywords that should be preserved
console.log('\n==================================================');
console.log('🔍 Cursor Keywords Validation:');
console.log('==================================================');

const checkKeywords = (formatted, modeName) => {
    const requiredKeywords = ['DECLARE', 'CURSOR FOR', 'OPEN', 'FETCH NEXT', 'WHILE', 'BEGIN', 'END', 'CLOSE', 'DEALLOCATE'];
    const issues = [];
    
    requiredKeywords.forEach(keyword => {
        if (!formatted.toUpperCase().includes(keyword)) {
            issues.push(`Missing: ${keyword}`);
        }
    });
    
    // Check for cursor name preservation
    if (!formatted.includes('db_cursor')) {
        issues.push('Missing: cursor name "db_cursor"');
    }
    
    // Check for variable preservation
    if (!formatted.includes('@ColumnName1') || !formatted.includes('@Id')) {
        issues.push('Missing: variables @ColumnName1 or @Id');
    }
    
    console.log(`${modeName}: ${issues.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
    if (issues.length > 0) {
        issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    return issues.length === 0;
};

const legacyPass = checkKeywords(legacyResult, 'Legacy');
const riverPass = checkKeywords(riverResult, 'River');
const indentPass = checkKeywords(indentResult, 'Indent');

console.log(`\n🎯 Overall Result: ${legacyPass && riverPass && indentPass ? '✅ ALL PASS' : '❌ ISSUES FOUND'}`);