console.log('🔍 Debugging hasCodeBeforeComment function\n');

function hasCodeBeforeComment(line) {
    const commentIndex = line.indexOf('--');
    if (commentIndex === -1) return false;
    
    const beforeComment = line.substring(0, commentIndex).trim();
    console.log(`Input: "${line}"`);
    console.log(`Comment index: ${commentIndex}`);
    console.log(`Before comment: "${beforeComment}"`);
    console.log(`Before comment length: ${beforeComment.length}`);
    console.log(`Result: ${beforeComment.length > 0}`);
    return beforeComment.length > 0;
}

const testCases = [
    'wf.CASEID -- comment',
    'wf.CASEID, -- comment',
    '-- standalone comment',
    'wf.DOCUMENT    -- comment2'
];

testCases.forEach((test, index) => {
    console.log(`\nTest ${index + 1}:`);
    hasCodeBeforeComment(test);
    console.log('─'.repeat(40));
});
