/**
 * Comprehensive Test Suite for T-SQLinator Formatter
 * Tests all formatting modes: Legacy, River, and Indent
 */

const { TSqlinatorFormatter } = require('./out/tSqlinatorFormatter');

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

// Test cases
const testCases = [
    {
        name: 'Basic SELECT with JOIN',
        sql: `select p.name,p.listprice,c.name from production.product p left join production.productcategory c on p.productcategoryid=c.productcategoryid where p.listprice>100 order by p.listprice desc`
    },
    {
        name: 'Complex query with subquery and window functions',
        sql: `
SELECT prdct.Name as ProductName
     , prdct.ListPrice
     , prdct.Color
     , cat.Name as CategoryName
     , subcat.Name as SubcategoryName
     , ROW_NUMBER() OVER (PARTITION BY p.ProductLine, left(p.ProductNumber, 2) ORDER BY right(p.ProductNumber, 4) DESC) as SequenceNum
  FROM Production.Product as prdct
  LEFT JOIN Production.ProductSubcategory as subcat
    ON prdct.ProductSubcategoryID = subcat.ProductSubcategoryID
  LEFT JOIN Production.ProductCategory as cat
    ON subcat.ProductCategoryID = cat.ProductCategoryID
 WHERE prdct.ListPrice <= 1000.00
   AND prdct.ProductID not in (
           SELECT _pd.ProductID
             FROM Production.ProductDocument _pd
            WHERE _pd.ModifiedDate < dateadd(year, -1, getutcdate())
       )
   AND prdct.Color in ('Black', 'Red', 'Silver')
 GROUP BY prdct.Name, prdct.ListPrice, prdct.Color, cat.Name, subcat.Name
 HAVING COUNT(*) > 1
   AND AVG(prdct.ListPrice) > 100
 ORDER BY prdct.ListPrice desc, prdct.Name
`
    },
    {
        name: 'CTE with multiple CTEs',
        sql: `with salesCTE as (select salesPersonID, sum(totaldue) as totalSales from sales.salesorderheader group by salesPersonID), topSales as (select top 10 salesPersonID, totalSales from salesCTE order by totalSales desc) select p.firstname, p.lastname, ts.totalSales from person.person p inner join topSales ts on p.businessentityid = ts.salesPersonID`
    },
    {
        name: 'INSERT with multiple values',
        sql: `insert into production.productcategory (name, modifieddate) values ('Test Category 1', getdate()), ('Test Category 2', getdate()), ('Test Category 3', getdate())`
    },
    {
        name: 'UPDATE with JOIN',
        sql: `update p set p.listprice = p.listprice * 1.1 from production.product p inner join production.productsubcategory ps on p.productsubcategoryid = ps.productsubcategoryid where ps.name like '%bike%'`
    },
    {
        name: 'DELETE with subquery',
        sql: `delete from production.product where productid in (select productid from production.product where listprice = 0 and sellstartdate < dateadd(year, -5, getdate()))`
    },
    {
        name: 'CASE statement',
        sql: `select productid, name, case when listprice = 0 then 'Free' when listprice < 50 then 'Cheap' when listprice < 200 then 'Moderate' else 'Expensive' end as priceCategory from production.product`
    },
    {
        name: 'Multiple statements',
        sql: `select count(*) from production.product; select top 5 name, listprice from production.product order by listprice desc; select avg(listprice) as avgPrice from production.product where listprice > 0`
    }
];

// Test runner
function runTests() {
    console.log('🧪 T-SQLinator Comprehensive Test Suite\n');
    console.log('========================================\n');
    
    let passedTests = 0;
    let totalTests = 0;
    let errors = [];
    
    Object.keys(configs).forEach(configName => {
        console.log(`\n📋 Testing ${configName.toUpperCase()} formatting:\n`);
        console.log('-'.repeat(50));
        
        const formatter = new TSqlinatorFormatter(configs[configName]);
        
        testCases.forEach((testCase, index) => {
            totalTests++;
            console.log(`\n${index + 1}. ${testCase.name}`);
            console.log('Input SQL:');
            console.log(testCase.sql.trim());
            console.log('\nFormatted Output:');
            
            try {
                const result = formatter.format(testCase.sql);
                console.log(result);
                
                // Basic validation checks
                if (result && result.length > 0) {
                    passedTests++;
                    console.log('✅ PASSED');
                } else {
                    console.log('❌ FAILED - Empty result');
                    errors.push(`${configName} - ${testCase.name}: Empty result`);
                }
            } catch (error) {
                console.log('❌ FAILED - Error occurred');
                console.log('Error:', error.message);
                errors.push(`${configName} - ${testCase.name}: ${error.message}`);
            }
            
            console.log('\n' + '='.repeat(80));
        });
    });
    
    // Test summary
    console.log('\n\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
        console.log('\n❌ ERRORS:');
        errors.forEach(error => console.log(`  - ${error}`));
        return false;
    } else {
        console.log('\n✅ All tests passed!');
        return true;
    }
}

// Specific feature tests
function runFeatureTests() {
    console.log('\n\n🔧 FEATURE-SPECIFIC TESTS');
    console.log('==========================\n');
    
    // Test River formatting alignment
    console.log('Testing River Formatting Alignment:');
    const riverFormatter = new TSqlinatorFormatter({ useRiverFormatting: true, riverColumn: 7 });
    const riverTest = 'SELECT col1, col2 FROM table1 WHERE col1 = 1';
    const riverResult = riverFormatter.format(riverTest);
    console.log(riverResult);
    
    // Check if keywords align to 7th column (position 6, 0-based)
    const lines = riverResult.split('\n');
    let riverAlignmentCorrect = true;
    lines.forEach(line => {
        const fromPos = line.indexOf('FROM');
        const wherePos = line.indexOf('WHERE');
        if (fromPos >= 0 && fromPos !== 6) {
            riverAlignmentCorrect = false;
        }
        if (wherePos >= 0 && wherePos !== 6) {
            riverAlignmentCorrect = false;
        }
    });
    
    console.log(riverAlignmentCorrect ? '✅ River alignment correct' : '❌ River alignment incorrect');
    
    // Test Indent formatting
    console.log('\nTesting Indent Formatting:');
    const indentFormatter = new TSqlinatorFormatter({ useIndentFormatting: true });
    const indentResult = indentFormatter.format(riverTest);
    console.log(indentResult);
    
    // Check for proper indentation
    const indentLines = indentResult.split('\n');
    let indentCorrect = indentLines.some(line => line.startsWith('    '));
    console.log(indentCorrect ? '✅ Indentation correct' : '❌ Indentation incorrect');
    
    return riverAlignmentCorrect && indentCorrect;
}

// Run all tests
console.log('Starting comprehensive T-SQLinator tests...\n');

const mainTestsPass = runTests();
const featureTestsPass = runFeatureTests();

const allTestsPass = mainTestsPass && featureTestsPass;

console.log('\n' + '='.repeat(80));
console.log(`\n🎯 FINAL RESULT: ${allTestsPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
console.log('='.repeat(80));

// Exit with appropriate code
process.exit(allTestsPass ? 0 : 1);