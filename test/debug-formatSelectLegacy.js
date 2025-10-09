console.log('🔍 Testing formatSelectLegacy logic\n');

function hasCodeBeforeComment(line) {
    const commentIndex = line.indexOf('--');
    if (commentIndex === -1) return false;
    
    const beforeComment = line.substring(0, commentIndex).trim();
    return beforeComment.length > 0;
}

// Simulate what happens in formatSelectLegacy
const testColumn = "wf.CASEID -- comment";
console.log(`Testing column: "${testColumn}"`);

const hasInlineComment = hasCodeBeforeComment(testColumn);
console.log(`hasInlineComment: ${hasInlineComment}`);

if (hasInlineComment) {
    console.log('\nInline comment detected - processing...');
    const commentIndex = testColumn.indexOf('--');
    const codeBeforeComment = testColumn.substring(0, commentIndex).trim();
    const comment = testColumn.substring(commentIndex);
    
    console.log(`Code before comment: "${codeBeforeComment}"`);
    console.log(`Comment: "${comment}"`);
    
    // Remove trailing comma from code part
    const cleanCode = codeBeforeComment.replace(/,\s*$/, '').trim();
    console.log(`Clean code: "${cleanCode}"`);
    
    // For comma before (which is default)
    const resultLine = '      ' + cleanCode + '\t' + comment;
    console.log(`Result line: "${resultLine}"`);
} else {
    console.log('\nNo inline comment detected - normal processing');
}
