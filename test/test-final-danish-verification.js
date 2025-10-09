const { TSqlinatorFormatter } = require('../out/tSqlinatorFormatter');

console.log('🎯 Final verification: Danish comment requirement\n');
console.log('Requirement: "hvis kommentarer med -- eller /**/ ir inde i et select statement så skal der ikke laves linjeskift før og efter"\n');

const formatter = new TSqlinatorFormatter();

// Original problematic SQL from the user
const originalSql = `SELECT 
    wf.CASEID,
    wf.DOCUMENT,
    -- Gruppér efter type baseret på trackingtype og tilstedeværelse af bruger
    CASE
        WHEN wf.TRACKINGTYPE = 36 THEN 'Automatik'
        WHEN wf.TRACKINGTYPE IN (10, 4) THEN 'Person'
        WHEN usr.NAME IS NOT NULL THEN 'Person'
        ELSE 'System'
    END AS GROUPING,
    wf.FAULT_MESSAGE
FROM #WORKFLOW AS wf`;

console.log('🔍 Original SQL:');
console.log('─'.repeat(60));
console.log(originalSql);

console.log('\n🚀 Formatted SQL:');
console.log('─'.repeat(60));
const formatted = formatter.format(originalSql);
console.log(formatted);

console.log('\n📊 Analysis:');
console.log('─'.repeat(60));

const lines = formatted.split('\n');
let danishCommentLine = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Gruppér efter type')) {
        danishCommentLine = i;
        break;
    }
}

if (danishCommentLine >= 0) {
    const commentLine = lines[danishCommentLine];
    const prevLine = lines[danishCommentLine - 1] || '';
    const nextLine = lines[danishCommentLine + 1] || '';
    
    console.log(`Danish comment found at line ${danishCommentLine + 1}:`);
    console.log(`"${commentLine}"`);
    console.log(`\nPrevious line: "${prevLine}"`);
    console.log(`Next line: "${nextLine}"`);
    
    const hasBlankLineBefore = prevLine.trim() === '';
    const hasBlankLineAfter = nextLine.trim() === '';
    
    if (!hasBlankLineBefore && !hasBlankLineAfter) {
        console.log('\n✅ SUCCESS: Comment is inline - no line breaks before or after!');
        console.log('✅ Danish requirement satisfied: "så skal der ikke laves linjeskift før og efter"');
    } else {
        console.log('\n❌ ISSUE: Comment has blank lines around it');
        console.log(`   Blank before: ${hasBlankLineBefore}, Blank after: ${hasBlankLineAfter}`);
    }
} else {
    console.log('❌ Danish comment not found in output');
}

console.log('\n🎉 Test completed!');