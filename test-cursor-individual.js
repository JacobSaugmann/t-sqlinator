const { TSqlinatorFormatter } = require('./out/tSqlinatorFormatter.js');

// Test minimal cursor statements individually
const cursorStatements = [
    'DECLARE db_cursor CURSOR FOR\nSELECT DISTINCT Name\nFROM #Organization',
    'OPEN db_cursor',
    'FETCH NEXT FROM db_cursor INTO @ColumnName1',
    'CLOSE db_cursor',
    'DEALLOCATE db_cursor'
];

console.log('🧪 Testing Individual Cursor Statements');

cursorStatements.forEach((stmt, index) => {
    console.log(`\n${index + 1}. Testing: "${stmt.replace(/\n/g, ' ')}"`);
    
    const formatter = new TSqlinatorFormatter({
        useRiverFormatting: false,
        useIndentFormatting: false
    });
    
    const result = formatter.format(stmt);
    console.log(`   Result: "${result.replace(/\n/g, ' ')}"`);
    
    // Check if the result contains all original keywords
    const originalWords = stmt.toUpperCase().split(/\s+/);
    const resultWords = result.toUpperCase().split(/\s+/);
    
    const missingWords = originalWords.filter(word => 
        word.length > 2 && // Skip short words
        !resultWords.includes(word)
    );
    
    if (missingWords.length > 0) {
        console.log(`   ❌ Missing words: ${missingWords.join(', ')}`);
    } else {
        console.log(`   ✅ All keywords preserved`);
    }
});

// Also test the problem with table name corruption
console.log('\n🔍 Testing Table Name Corruption Issue:');
const tableTestSQL = 'SELECT Name FROM #Organization';
console.log(`Input: "${tableTestSQL}"`);

const formatter = new TSqlinatorFormatter();
const result = formatter.format(tableTestSQL);
console.log(`Output: "${result.trim()}"`);

if (result.includes('#Organization')) {
    console.log('✅ Table name preserved');
} else {
    console.log('❌ Table name corrupted');
}