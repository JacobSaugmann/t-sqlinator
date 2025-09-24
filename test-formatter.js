// Simple test for the SQL formatter
// Since we can't easily run TypeScript directly, this shows the expected behavior

const testSql = `SELECT a.id, a.name, b.description, c.value FROM table_a a INNER JOIN table_b b ON a.id = b.a_id AND a.status = 'active' LEFT JOIN table_c c ON b.id = c.b_id AND c.deleted = 0`;

console.log('Input SQL:');
console.log(testSql);
console.log('\nExpected formatted output:');
console.log(`SELECT
    a.id
    , a.name
    , b.description
    , c.value
FROM table_a a
    INNER JOIN table_b b
        ON a.id = b.a_id
        AND a.status = 'active'
    LEFT JOIN table_c c
        ON b.id = c.b_id
        AND c.deleted = 0`);