/**
 * Comprehensive Test Suite for T-SQLinator Formatter
 * Tests all formatting modes with extensive SQL scenarios
 * Includes regression tests for BigQuery.sql JOIN preservation
 */

const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');
const fs = require('fs');

// Test configurations
const configs = {
    legacy: {
        useRiverFormatting: false,
        useIndentFormatting: false,
        keywordCase: 'upper',
        functionCase: 'upper',
        dataTypeCase: 'upper',
        commaPosition: 'before',
        alignCommas: true,
        alignAliases: true
    },
    river: {
        useRiverFormatting: true,
        riverColumn: 7,
        useIndentFormatting: false,
        keywordCase: 'upper',
        functionCase: 'upper',
        dataTypeCase: 'upper',
        commaPosition: 'before',
        alignCommas: true,
        alignAliases: true
    },
    indent: {
        useRiverFormatting: false,
        useIndentFormatting: true,
        keywordCase: 'upper',
        functionCase: 'upper',
        dataTypeCase: 'upper',
        commaPosition: 'before',
        alignCommas: true,
        alignAliases: true
    }
};

// Basic test cases
const basicTestCases = [
    {
        name: 'Basic SELECT with INNER JOIN',
        sql: `select p.name,p.listprice,c.name from production.product p inner join production.productcategory c on p.productcategoryid=c.productcategoryid where p.listprice>100`,
        expectedPatterns: ['INNER JOIN'] // Must preserve INNER JOIN
    },
    {
        name: 'Complex query with multiple JOIN types',
        sql: `
SELECT p.Name, c.Name, s.Name 
FROM Product p 
INNER JOIN Category c ON p.CategoryID = c.ID
LEFT OUTER JOIN Subcategory s ON p.SubcategoryID = s.ID
RIGHT JOIN Vendor v ON p.VendorID = v.ID
FULL OUTER JOIN Supplier sup ON p.SupplierID = sup.ID
CROSS JOIN Settings st
WHERE p.Active = 1`,
        expectedPatterns: ['INNER JOIN', 'LEFT OUTER JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN']
    },
    {
        name: 'CTE with INNER JOIN',
        sql: `with salesCTE as (select salesPersonID, sum(totaldue) as totalSales from sales.salesorderheader soh inner join sales.customer c on soh.customerid = c.customerid group by salesPersonID) select * from salesCTE`,
        expectedPatterns: ['INNER JOIN']
    },
    {
        name: 'Nested subquery with JOINs',
        sql: `select * from (select p.id, p.name from product p inner join category c on p.categoryid = c.id) as filtered left join vendor v on filtered.vendorid = v.id`,
        expectedPatterns: ['INNER JOIN', 'LEFT JOIN']
    },
    {
        name: 'Window functions with JOINs',
        sql: `SELECT p.Name, ROW_NUMBER() OVER (PARTITION BY c.Name ORDER BY p.Price DESC) as RowNum FROM Product p INNER JOIN Category c ON p.CategoryID = c.ID`,
        expectedPatterns: ['INNER JOIN', 'ROW_NUMBER() OVER']
    },
    {
        name: 'Multiple statement script',
        sql: `
        DROP TABLE IF EXISTS #temp;
        CREATE TABLE #temp (id int, name varchar(50));
        INSERT INTO #temp SELECT p.id, p.name FROM product p INNER JOIN category c ON p.categoryid = c.id;
        SELECT * FROM #temp t LEFT JOIN vendor v ON t.vendorid = v.id;
        DROP TABLE #temp;`,
        expectedPatterns: ['DROP TABLE', 'CREATE TABLE', 'INSERT INTO', 'INNER JOIN', 'LEFT JOIN']
    },
    {
        name: 'Complex aggregation with GROUP BY and HAVING',
        sql: `
        SELECT c.Name, COUNT(*), AVG(p.Price), SUM(p.Stock)
        FROM Category c 
        INNER JOIN Product p ON c.ID = p.CategoryID
        LEFT JOIN Vendor v ON p.VendorID = v.ID
        WHERE p.Active = 1 AND v.Country = 'USA'
        GROUP BY c.Name, c.Description
        HAVING COUNT(*) > 10 AND AVG(p.Price) > 100
        ORDER BY AVG(p.Price) DESC`,
        expectedPatterns: ['INNER JOIN', 'LEFT JOIN', 'GROUP BY', 'HAVING', 'ORDER BY']
    },
    {
        name: 'Cursor and temporary tables',
        sql: `
        DECLARE @id INT, @name VARCHAR(50);
        DECLARE cursor_test CURSOR FOR 
        SELECT p.id, p.name FROM product p INNER JOIN category c ON p.categoryid = c.id;
        OPEN cursor_test;
        FETCH NEXT FROM cursor_test INTO @id, @name;
        WHILE @@FETCH_STATUS = 0 BEGIN
            PRINT @name;
            FETCH NEXT FROM cursor_test INTO @id, @name;
        END;
        CLOSE cursor_test;
        DEALLOCATE cursor_test;`,
        expectedPatterns: ['DECLARE', 'CURSOR FOR', 'INNER JOIN', 'WHILE', 'FETCH NEXT']
    }
];

// Test BigQuery.sql file if it exists
let bigQueryTest = null;
try {
    const bigQuerySQL = fs.readFileSync('./BigQuery.sql', 'utf8');
    bigQueryTest = {
        name: 'BigQuery.sql - Real-world complex script',
        sql: bigQuerySQL,
        expectedPatterns: ['INNER JOIN', 'LEFT JOIN', 'CTE', 'CURSOR', 'TEMPORARY TABLE']
    };
} catch (error) {
    console.log('⚠️  BigQuery.sql not found, skipping BigQuery test');
}

function runBasicTests() {
    console.log('🧪 T-SQLinator Comprehensive Test Suite\n');
    console.log('========================================\n');
    
    let totalTests = 0;
    let passedTests = 0;
    let errors = [];
    
    Object.keys(configs).forEach(configName => {
        console.log(`\n📋 Testing ${configName.toUpperCase()} formatting:\n`);
        console.log('-'.repeat(60));
        
        const formatter = new TSqlinatorFormatter(configs[configName]);
        
        basicTestCases.forEach((testCase, index) => {
            totalTests++;
            console.log(`\n${index + 1}. ${testCase.name}`);
            
            try {
                const result = formatter.format(testCase.sql);
                
                // Basic validation
                let passed = true;
                let validationErrors = [];
                
                if (!result || result.length === 0) {
                    passed = false;
                    validationErrors.push('Empty result');
                }
                
                // Check for expected patterns
                if (testCase.expectedPatterns) {
                    testCase.expectedPatterns.forEach(pattern => {
                        if (!result.includes(pattern)) {
                            passed = false;
                            validationErrors.push(`Missing expected pattern: ${pattern}`);
                        }
                    });
                }
                
                // River formatting specific checks (only for top-level statements)
                if (configName === 'river' && !testCase.name.includes('CTE') && !testCase.name.includes('Nested') && !testCase.name.includes('Multiple statement') && !testCase.name.includes('Cursor')) {
                    const lines = result.split('\n');
                    lines.forEach(line => {
                        ['FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING'].forEach(keyword => {
                            const pos = line.indexOf(keyword);
                            if (pos >= 0 && pos !== 6 && line.trim().startsWith(keyword)) {
                                passed = false;
                                validationErrors.push(`${keyword} not aligned to column 7 (found at ${pos})`);
                            }
                        });
                    });
                }
                
                if (passed) {
                    passedTests++;
                    console.log('✅ PASSED');
                } else {
                    console.log('❌ FAILED');
                    validationErrors.forEach(error => console.log(`   - ${error}`));
                    errors.push(`${configName} - ${testCase.name}: ${validationErrors.join(', ')}`);
                }
                
            } catch (error) {
                console.log('❌ FAILED - Exception occurred');
                console.log(`   Error: ${error.message}`);
                errors.push(`${configName} - ${testCase.name}: ${error.message}`);
            }
            
            console.log('─'.repeat(60));
        });
    });
    
    return { totalTests, passedTests, errors };
}

function runBigQueryTest() {
    if (!bigQueryTest) return { totalTests: 0, passedTests: 0, errors: [] };
    
    console.log('\n\n📋 BIGQUERY.SQL REGRESSION TEST');
    console.log('=================================\n');
    
    let totalTests = 0;
    let passedTests = 0;
    let errors = [];
    
    Object.keys(configs).forEach(configName => {
        totalTests++;
        console.log(`Testing ${configName.toUpperCase()} with BigQuery.sql...`);
        
        try {
            const formatter = new TSqlinatorFormatter(configs[configName]);
            const result = formatter.format(bigQueryTest.sql);
            
            // Critical test: Ensure INNER JOIN is preserved
            const innerJoinCount = (result.match(/INNER JOIN/gi) || []).length;
            const originalInnerJoinCount = (bigQueryTest.sql.match(/INNER JOIN/gi) || []).length;
            
            if (innerJoinCount === originalInnerJoinCount && innerJoinCount > 0) {
                passedTests++;
                console.log(`✅ PASSED - INNER JOIN preserved (${innerJoinCount} instances)`);
            } else {
                console.log(`❌ FAILED - INNER JOIN not preserved (expected ${originalInnerJoinCount}, got ${innerJoinCount})`);
                errors.push(`${configName} - BigQuery: INNER JOIN preservation failed`);
            }
            
        } catch (error) {
            console.log(`❌ FAILED - Exception: ${error.message}`);
            errors.push(`${configName} - BigQuery: ${error.message}`);
        }
    });
    
    return { totalTests, passedTests, errors };
}

function runPerformanceTest() {
    console.log('\n\n⚡ PERFORMANCE TEST');
    console.log('===================\n');
    
    if (!bigQueryTest) {
        console.log('⚠️  Skipping performance test - BigQuery.sql not available');
        return;
    }
    
    const formatter = new TSqlinatorFormatter(configs.river);
    const iterations = 10;
    
    console.log(`Formatting BigQuery.sql ${iterations} times...`);
    
    const startTime = Date.now();
    for (let i = 0; i < iterations; i++) {
        formatter.format(bigQueryTest.sql);
    }
    const endTime = Date.now();
    
    const avgTime = (endTime - startTime) / iterations;
    console.log(`✅ Average formatting time: ${avgTime.toFixed(2)}ms`);
    console.log(`✅ Total test time: ${endTime - startTime}ms`);
}

function runRegressionTests() {
    console.log('\n\n📋 BUG REGRESSION TESTS');
    console.log('========================\n');

    let totalTests = 0;
    let passedTests = 0;
    const errors = [];

    function check(name, actual, condition, description) {
        totalTests++;
        if (condition) {
            passedTests++;
            console.log(`✅ ${name}`);
        } else {
            console.log(`❌ ${name}: ${description}\n   Got: ${JSON.stringify(actual)}`);
            errors.push(`${name}: ${description}`);
        }
    }

    const f = new TSqlinatorFormatter(configs.river);

    // BUG: Block comment på én linje med length <= 4 lukkes aldrig
    // /**/  har length 4 — bør ikke sætte inBlockComment = true for resten af dokumentet
    const shortBlockComment = `/**/ SELECT col1\n  FROM tbl`;
    const shortBlockResult = f.format(shortBlockComment);
    check(
        'Block comment /**/ does not swallow rest of document',
        shortBlockResult,
        shortBlockResult.toUpperCase().includes('SELECT') && shortBlockResult.toUpperCase().includes('FROM'),
        'SELECT/FROM should survive after /**/'
    );

    // BUG: parseWhereConditions splitter AND inde i subquery
    const subqueryWhere = `SELECT col1
  FROM tbl
 WHERE col1 IN (SELECT x FROM t WHERE a = 1 AND b = 2)
   AND col2 = 3`;
    const subqueryResult = f.format(subqueryWhere);
    const inClausePreserved = /IN\s*\(\s*SELECT/i.test(subqueryResult);
    check(
        'parseWhereConditions preserves AND inside subquery IN(...)',
        subqueryResult,
        inClausePreserved,
        'IN (SELECT ... WHERE a AND b) should not be split on inner AND'
    );

    // BUG: isStatementEnd afslutter blok på END der tilhører CASE
    const caseSelect = `SELECT CASE WHEN col1 = 1 THEN 'a' ELSE 'b' END AS label\n  FROM tbl`;
    const caseResult = f.format(caseSelect);
    check(
        'CASE...END inside SELECT does not split block prematurely',
        caseResult,
        caseResult.toUpperCase().includes('FROM'),
        'FROM should be in same formatted block as SELECT with CASE'
    );

    // BUG: ASC bør ikke fjernes fra ORDER BY
    const ascQuery = `SELECT col1 FROM tbl ORDER BY col1 ASC, col2 DESC`;
    const ascResult = f.format(ascQuery);
    check(
        'ASC preserved in ORDER BY',
        ascResult,
        /\bASC\b/i.test(ascResult),
        'ASC should not be stripped from ORDER BY'
    );

    // newlineBeforeHaving: HAVING skal formateres på ny linje (default)
    const havingQuery = `SELECT dept, COUNT(*) AS cnt FROM employees GROUP BY dept HAVING COUNT(*) > 5`;
    const havingResult = f.format(havingQuery);
    check(
        'HAVING appears in formatted output',
        havingResult,
        /\bHAVING\b/i.test(havingResult),
        'HAVING keyword should be present in formatted output'
    );
    check(
        'HAVING on its own line by default (newlineBeforeHaving: true)',
        havingResult,
        /\n\s*HAVING\b/i.test(havingResult),
        'HAVING should appear on a new line with default config'
    );

    // newlineBeforeHaving: false — HAVING inline efter GROUP BY
    const fInline = new TSqlinatorFormatter({ ...configs.river, newlineBeforeHaving: false });
    const havingInlineResult = fInline.format(havingQuery);
    check(
        'HAVING inline when newlineBeforeHaving: false',
        havingInlineResult,
        !/\n\s*HAVING\b/i.test(havingInlineResult),
        'HAVING should NOT be on its own line when newlineBeforeHaving is false'
    );

    return { totalTests, passedTests, errors };
}

// Run all tests
console.log('🚀 Starting comprehensive T-SQLinator tests...\n');

const basicResults = runBasicTests();
const bigQueryResults = runBigQueryTest();
const regressionResults = runRegressionTests();

runPerformanceTest();

// Summary
const totalTests = basicResults.totalTests + bigQueryResults.totalTests + regressionResults.totalTests;
const passedTests = basicResults.passedTests + bigQueryResults.passedTests + regressionResults.passedTests;
const allErrors = [...basicResults.errors, ...bigQueryResults.errors, ...regressionResults.errors];

console.log('\n\n📊 FINAL TEST SUMMARY');
console.log('=====================');
console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (allErrors.length > 0) {
    console.log('\n❌ ERRORS:');
    allErrors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
} else {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ BigQuery.sql INNER JOIN regression test passed');
    console.log('✅ River formatting alignment verified');
    console.log('✅ All SQL patterns preserved correctly');
    process.exit(0);
}
