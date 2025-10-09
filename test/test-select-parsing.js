const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

const sql = 'SELECT wf.CASEID -- Unik ID for workflow-case';

console.log('🧪 Testing SELECT Statement Parsing\n');

const formatter = new TSqlinatorFormatter();

// Test parseSelectColumns directly
console.log('📝 Original SQL:');
console.log(sql);
console.log('\n🔧 parseSelectColumns output:');

// We need to access the private method for testing
// Let's format the whole statement and see what happens
const formatted = formatter.format(sql);
console.log('\n📊 Formatted result:');
console.log(formatted);

// Let's also test a multi-column example
const multiColumnSql = `SELECT
    wf.CASEID,     -- Unik ID for workflow-case
    wf.DOCUMENT    -- Dokumentnavn eller reference`;

console.log('\n\n🧪 Testing Multi-Column SELECT\n');
console.log('📝 Original SQL:');
console.log(multiColumnSql);

const multiFormatted = formatter.format(multiColumnSql);
console.log('\n📊 Formatted result:');
console.log(multiFormatted);
