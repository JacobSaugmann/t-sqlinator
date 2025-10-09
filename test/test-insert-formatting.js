const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

// Test INSERT statement formatting
const testInserts = `
INSERT INTO Products (ProductID, ProductName, Price)
VALUES (101, 'SQL Formatter Pro', 99.99);

INSERT INTO OrderLines (OrderLineID, OrderID, ProductID, Quantity)
VALUES (1, 1001, 101, 2);

INSERT INTO Sales (SalesID, SalesPerson, Region, Amount)
VALUES 
    (1, 'Jacob', 'East', 100),
    (2, 'Jacob', 'West', 150),
    (3, 'Lars', 'East', 200),
    (4, 'Lars', 'West', 250),
    (5, 'Kim', 'East', 300),
    (6, 'Kim', 'West', 350);
`;

console.log('🧪 Testing INSERT Statement Formatting\n');
console.log('📝 Original INSERT statements:');
console.log(testInserts);

const configs = [
    { name: 'Legacy', config: { useRiverFormatting: false, useIndentFormatting: false } },
    { name: 'River', config: { useRiverFormatting: true, riverColumn: 7, useIndentFormatting: false } },
    { name: 'Indent', config: { useRiverFormatting: false, useIndentFormatting: true } }
];

configs.forEach(({ name, config }) => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📋 ${name} Formatting:`);
    console.log(`${'='.repeat(50)}`);
    
    const formatter = new TSqlinatorFormatter(config);
    const result = formatter.format(testInserts);
    console.log(result);
});

process.exit(0);
