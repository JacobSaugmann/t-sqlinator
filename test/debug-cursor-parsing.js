const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter.js');

// Debugging the parsing process
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

// Let's create a test formatter to examine the parsing
class DebugFormatter extends TSqlinatorFormatter {
    constructor() {
        super();
    }
    
    debugParseIntoBlocks(sql) {
        // Access the private method by calling it through the parent
        return this.parseIntoBlocks(sql);
    }
}

console.log('🔍 Debugging Cursor SQL Parsing');
console.log('\n📝 Original SQL:');
console.log(cursorSQL);

const debugFormatter = new DebugFormatter();
// Note: This won't work because parseIntoBlocks is private
// Let's instead manually analyze what should happen

console.log('\n📊 Expected Cursor Blocks:');
console.log('1. Line comment: "-- Declare a cursor..."');
console.log('2. DECLARE_BLOCK: "DECLARE @ColumnName1..."');  
console.log('3. CURSOR_STATEMENT: "DECLARE db_cursor CURSOR FOR..."');
console.log('4. CURSOR_STATEMENT: "OPEN db_cursor"');
console.log('5. CURSOR_STATEMENT: "FETCH NEXT FROM db_cursor..."');
console.log('6. STATEMENT: "WHILE @@FETCH_STATUS = 0..."');
console.log('7. CURSOR_STATEMENT: "CLOSE db_cursor"');
console.log('8. CURSOR_STATEMENT: "DEALLOCATE db_cursor"');

// Test individual cursor lines to see what block type they get
const cursorLines = [
    'DECLARE db_cursor CURSOR FOR',
    'OPEN db_cursor',  
    'FETCH NEXT FROM db_cursor INTO @ColumnName1',
    'CLOSE db_cursor',
    'DEALLOCATE db_cursor'
];

console.log('\n🧪 Testing Individual Cursor Lines:');
cursorLines.forEach(line => {
    const formatter = new TSqlinatorFormatter();
    const result = formatter.format(line);
    console.log(`Input: "${line}"`);
    console.log(`Output: "${result.trim()}"`);
    console.log('---');
});
