const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🔍 Analyzing Test 4 and 5 failures\n');

// Test 4 case
const test4SQL = `SELECT
    wf.CASEID,      -- Primary key comment
    wf.DOCUMENT,    -- Document reference
    wf.STATUS       -- Current status`;

const formatter = new TSqlinatorFormatter();
const test4Result = formatter.format(test4SQL);

console.log('=== TEST 4 ANALYSIS ===');
console.log('Input:');
console.log(test4SQL);
console.log('\nOutput:');
console.log(test4Result);
console.log('\nOutput (escaped):');
console.log(JSON.stringify(test4Result));

// Test the regex pattern
const test4Pattern = /wf\.CASEID.*--.*Primary key[\s\S]*wf\.DOCUMENT.*--.*Document reference/;
const test4Passes = test4Pattern.test(test4Result);
console.log(`\nExpected pattern: ${test4Pattern}`);
console.log(`Pattern matches: ${test4Passes}`);

if (!test4Passes) {
    console.log('\nLet\'s check what we have:');
    const lines = test4Result.split('\n');
    lines.forEach((line, index) => {
        console.log(`  Line ${index + 1}: "${line}"`);
        if (line.includes('wf.CASEID')) {
            console.log(`    -> Contains "wf.CASEID": ${line.includes('wf.CASEID')}`);
            console.log(`    -> Contains "--": ${line.includes('--')}`);
            console.log(`    -> Contains "Primary key": ${line.includes('Primary key')}`);
            console.log(`    -> Contains "PRIMARY KEY": ${line.includes('PRIMARY KEY')}`);
        }
        if (line.includes('wf.DOCUMENT')) {
            console.log(`    -> Contains "wf.DOCUMENT": ${line.includes('wf.DOCUMENT')}`);
            console.log(`    -> Contains "--": ${line.includes('--')}`);
            console.log(`    -> Contains "Document reference": ${line.includes('Document reference')}`);
        }
    });
}

console.log('\n\n=== TEST 5 ANALYSIS ===');

// Test 5 case
const test5SQL = `SELECT
    wf.CASEID /* primary key */,
    wf.DOCUMENT /* doc ref */`;

const test5Result = formatter.format(test5SQL);

console.log('Input:');
console.log(test5SQL);
console.log('\nOutput:');
console.log(test5Result);
console.log('\nOutput (escaped):');
console.log(JSON.stringify(test5Result));

// Test the regex pattern  
const test5Pattern = /wf\.CASEID.*\/\*.*primary key.*\*\/[\s\S]*wf\.DOCUMENT.*\/\*.*doc ref.*\*\//;
const test5Passes = test5Pattern.test(test5Result);
console.log(`\nExpected pattern: ${test5Pattern}`);
console.log(`Pattern matches: ${test5Passes}`);

if (!test5Passes) {
    console.log('\nLet\'s check what we have:');
    const lines = test5Result.split('\n');
    lines.forEach((line, index) => {
        console.log(`  Line ${index + 1}: "${line}"`);
        if (line.includes('wf.CASEID')) {
            console.log(`    -> Contains "wf.CASEID": ${line.includes('wf.CASEID')}`);
            console.log(`    -> Contains "/*": ${line.includes('/*')}`);
            console.log(`    -> Contains "primary key": ${line.includes('primary key')}`);
            console.log(`    -> Contains "PRIMARY KEY": ${line.includes('PRIMARY KEY')}`);
        }
        if (line.includes('wf.DOCUMENT')) {
            console.log(`    -> Contains "wf.DOCUMENT": ${line.includes('wf.DOCUMENT')}`);
            console.log(`    -> Contains "/*": ${line.includes('/*')}`);
            console.log(`    -> Contains "doc ref": ${line.includes('doc ref')}`);
        }
    });
}
