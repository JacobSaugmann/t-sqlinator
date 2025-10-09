const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🧪 Testing T-SQLinator Configuration Options...\n');

// Test different formatting styles
const testSql = `SELECT emp.name, emp.salary, dept.department_name FROM employees emp INNER JOIN departments dept ON emp.dept_id = dept.id WHERE emp.salary > 50000 ORDER BY emp.salary DESC`;

console.log('Original SQL:');
console.log('─'.repeat(80));
console.log(testSql);
console.log('');

// Test 1: River Formatting (default)
console.log('🌊 River Formatting (useRiverFormatting: true, riverColumn: 7):');
console.log('─'.repeat(80));
const riverFormatter = new TSqlinatorFormatter({
    useRiverFormatting: true,
    riverColumn: 7,
    useIndentFormatting: false
});
console.log(riverFormatter.format(testSql));
console.log('');

// Test 2: Indent Formatting
console.log('📏 Indent Formatting (useIndentFormatting: true):');
console.log('─'.repeat(80));
const indentFormatter = new TSqlinatorFormatter({
    useRiverFormatting: false,
    useIndentFormatting: true,
    indentSize: 4
});
console.log(indentFormatter.format(testSql));
console.log('');

// Test 3: Custom River Column
console.log('🌊 Custom River Column (riverColumn: 10):');
console.log('─'.repeat(80));
const customRiverFormatter = new TSqlinatorFormatter({
    useRiverFormatting: true,
    riverColumn: 10,
    useIndentFormatting: false
});
console.log(customRiverFormatter.format(testSql));
console.log('');

// Test 4: Different comma positions
console.log('📝 Comma After (commaPosition: "after"):');
console.log('─'.repeat(80));
const commaAfterFormatter = new TSqlinatorFormatter({
    commaPosition: 'after',
    useRiverFormatting: true,
    riverColumn: 7
});
console.log(commaAfterFormatter.format(testSql));
console.log('');

console.log('✅ All formatting styles tested!');
console.log('\n📋 Available Configuration Options:');
console.log('  • useRiverFormatting: Enable/disable river formatting');
console.log('  • riverColumn: Column position for river alignment (1-20)');
console.log('  • useIndentFormatting: Use traditional indentation instead');
console.log('  • keywordCase: upper/lower/preserve');
console.log('  • functionCase: upper/lower/preserve');
console.log('  • dataTypeCase: upper/lower/preserve');
console.log('  • commaPosition: before/after');
console.log('  • alignCommas: true/false');
console.log('  • alignAliases: true/false');
console.log('  • newlineAfterSelect: true/false');
console.log('  • newlineBeforeFrom: true/false');
console.log('  • newlineBeforeWhere: true/false');
console.log('  • newlineBeforeGroupBy: true/false');
console.log('  • newlineBeforeOrderBy: true/false');
console.log('  • indentSize: 1-8 spaces');
console.log('  • linesBetweenQueries: 0-5 blank lines');
console.log('\n🎉 All options should now be available in VS Code Settings UI!');