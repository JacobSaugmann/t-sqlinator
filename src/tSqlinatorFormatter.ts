/**
 * T-SQLinator SQL Formatter
 * Enterprise SQL Formatter - Safe Multi-Statement Handler
 * Designed to handle complex scripts without destroying code
 */

interface TSqlinatorConfig {
    keywordCase: 'upper' | 'lower' | 'preserve';
    functionCase: 'upper' | 'lower' | 'preserve';
    dataTypeCase: 'upper' | 'lower' | 'preserve';
    indentSize: number;
    commaPosition: 'before' | 'after';
    alignCommas: boolean;
    alignAliases: boolean;
    newlineAfterSelect: boolean;
    newlineBeforeFrom: boolean;
    newlineBeforeWhere: boolean;
    newlineBeforeGroupBy: boolean;
    newlineBeforeOrderBy: boolean;
    linesBetweenQueries: number;
    // River formatting options
    useRiverFormatting: boolean;
    riverColumn: number; // Column position for the "river" (default 7)
    useIndentFormatting: boolean; // Alternative to river formatting
}

export class TSqlinatorFormatter {
    private config: TSqlinatorConfig;
    
    private readonly keywords = [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
        'TABLE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'DATABASE', 'SCHEMA',
        'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'ON', 'AS',
        'GROUP', 'BY', 'ORDER', 'HAVING', 'UNION', 'ALL', 'DISTINCT', 'TOP',
        'INTO', 'VALUES', 'SET', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
        'IF', 'ELSE', 'WHILE', 'FOR', 'DECLARE', 'BEGIN', 'END', 'TRY', 'CATCH',
        'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE', 'IS', 'NULL',
        'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'UNIQUE', 'CHECK',
        'DEFAULT', 'IDENTITY', 'AUTO_INCREMENT', 'WITH', 'CTE', 'RECURSIVE',
        // Cursor keywords
        'CURSOR', 'OPEN', 'FETCH', 'NEXT', 'CLOSE', 'DEALLOCATE'
    ];

    constructor(userConfig?: Partial<TSqlinatorConfig>) {
        this.config = {
            keywordCase: 'upper',
            functionCase: 'upper',
            dataTypeCase: 'upper',
            indentSize: 4,
            commaPosition: 'before',
            alignCommas: true,
            alignAliases: true,
            newlineAfterSelect: true,
            newlineBeforeFrom: true,
            newlineBeforeWhere: true,
            newlineBeforeGroupBy: true,
            newlineBeforeOrderBy: true,
            linesBetweenQueries: 2,
            // River formatting defaults
            useRiverFormatting: true,
            riverColumn: 7,
            useIndentFormatting: false,
            ...userConfig
        };
    }

    public format(sql: string): string {
        try {
            // Parse the SQL into individual statements and blocks
            const blocks = this.parseIntoBlocks(sql);
            const formattedBlocks: string[] = [];

            for (const block of blocks) {
                if (block.type === 'COMMENT' || block.type === 'LINE_COMMENT') {
                    // Comments are already formatted, just preserve them
                    formattedBlocks.push(block.content);
                } else if (block.type === 'CTE_STATEMENT') {
                    // Format CTE statements with special handling
                    const formatted = this.formatCteStatement(block.content);
                    formattedBlocks.push(formatted);
                } else if (block.type === 'SIMPLE_SELECT') {
                    // Format simple SELECT statements
                    const formatted = this.formatSimpleSelect(block.content);
                    formattedBlocks.push(formatted);
                } else if (block.type === 'CURSOR_STATEMENT') {
                    // Cursor statements should be preserved with minimal formatting
                    const formatted = this.formatCursorStatement(block.content);
                    formattedBlocks.push(formatted);
                } else if (block.type === 'COMPLEX_STATEMENT') {
                    // For complex statements, just apply keyword casing and preserve structure
                    const formatted = this.formatComplexStatement(block.content);
                    formattedBlocks.push(formatted);
                } else {
                    // Default: preserve the content with minimal formatting
                    const formatted = this.applyBasicFormatting(block.content);
                    formattedBlocks.push(formatted);
                }
            }

            // Join blocks intelligently with proper comment spacing
            const result: string[] = [];
            for (let i = 0; i < formattedBlocks.length; i++) {
                const block = blocks[i];
                const content = formattedBlocks[i];
                
                if (i > 0) {
                    const previousBlock = blocks[i - 1];
                    const isStandaloneComment = (block.type === 'LINE_COMMENT' || block.type === 'COMMENT') && 
                                             this.isStandaloneComment(block.content);
                    const wasPreviousStandaloneComment = (previousBlock.type === 'LINE_COMMENT' || previousBlock.type === 'COMMENT') && 
                                                      this.isStandaloneComment(previousBlock.content);
                    
                    if (isStandaloneComment && !wasPreviousStandaloneComment) {
                        // Add 2 blank lines before standalone comment
                        result.push('\n\n\n');
                    } else if (!isStandaloneComment && wasPreviousStandaloneComment) {
                        // Add 2 blank lines after standalone comment
                        result.push('\n\n\n');
                    } else if (block.type === 'LINE_COMMENT' || block.type === 'COMMENT' || 
                              previousBlock.type === 'LINE_COMMENT' || previousBlock.type === 'COMMENT') {
                        // Regular spacing for other comments
                        result.push('\n');
                    } else {
                        // Double line break for regular statements
                        result.push('\n\n');
                    }
                }
                result.push(content);
            }
            
            return result.join('');
        } catch (error) {
            // If formatting fails, return the original SQL to prevent data loss
            console.warn('SQL formatting failed, returning original:', error);
            return sql;
        }
    }

    private parseIntoBlocks(sql: string): Array<{type: string, content: string}> {
        const blocks: Array<{type: string, content: string}> = [];
        const lines = sql.split(/\r?\n/);
        
        let currentBlock = '';
        let blockType = 'UNKNOWN';
        let inBlockComment = false;
        let inStringLiteral = false;
        let stringDelimiter = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Handle block comments
            if (trimmedLine.startsWith('/*')) {
                if (currentBlock.trim()) {
                    blocks.push({type: blockType, content: currentBlock.trim()});
                    currentBlock = '';
                }
                inBlockComment = true;
                blockType = 'COMMENT';
                currentBlock = line;
                
                // Check if comment ends on same line
                if (trimmedLine.endsWith('*/') && trimmedLine.length > 4) {
                    inBlockComment = false;
                    blocks.push({type: 'COMMENT', content: currentBlock});
                    currentBlock = '';
                    blockType = 'UNKNOWN';
                }
                continue;
            }

            if (inBlockComment) {
                currentBlock += '\n' + line;
                if (trimmedLine.endsWith('*/')) {
                    inBlockComment = false;
                    blocks.push({type: 'COMMENT', content: currentBlock});
                    currentBlock = '';
                    blockType = 'UNKNOWN';
                }
                continue;
            }

            // Handle line comments - distinguish between standalone and statement comments
            if (trimmedLine.startsWith('--')) {
                // Check if this comment is part of an ongoing SQL statement
                const isPartOfStatement = this.isCommentPartOfStatement(currentBlock, blockType, i, lines);
                
                if (isPartOfStatement) {
                    // This comment is part of the current SQL statement - keep it in the same block
                    currentBlock += (currentBlock ? '\n' : '') + line;
                } else {
                    // This is a standalone comment - save current block first if exists
                    if (currentBlock.trim() && blockType !== 'LINE_COMMENT') {
                        blocks.push({type: blockType, content: currentBlock.trim()});
                        currentBlock = '';
                    }
                    
                    // Start or continue a line comment block
                    if (blockType !== 'LINE_COMMENT') {
                        blockType = 'LINE_COMMENT';
                        currentBlock = line;
                    } else {
                        currentBlock += '\n' + line;
                    }
                }
                continue;
            } else {
                // If we were in a line comment block and now we're not, save the comment block
                if (blockType === 'LINE_COMMENT' && currentBlock.trim()) {
                    blocks.push({type: 'LINE_COMMENT', content: currentBlock.trim()});
                    currentBlock = '';
                    blockType = 'UNKNOWN';
                }
            }

            // Empty lines - add to current block
            if (!trimmedLine) {
                if (currentBlock) {
                    currentBlock += '\n' + line;
                }
                continue;
            }

            // Determine block type if we're starting a new block
            if (!currentBlock.trim()) {
                blockType = this.determineBlockType(trimmedLine);
            }

            currentBlock += (currentBlock ? '\n' : '') + line;

            // Check for statement terminators
            if (this.isStatementEnd(line, i, lines, blockType)) {
                if (currentBlock.trim()) {
                    blocks.push({type: blockType, content: currentBlock.trim()});
                }
                currentBlock = '';
                blockType = 'UNKNOWN';
            }
        }

        // Add any remaining content
        if (currentBlock.trim()) {
            blocks.push({type: blockType, content: currentBlock.trim()});
        }

        return blocks;
    }

    private determineBlockType(firstLine: string): string {
        const upperLine = firstLine.toUpperCase();
        
        // CTE (Common Table Expression) statements
        if (upperLine.startsWith(';WITH ') || upperLine.startsWith('WITH ')) {
            return 'CTE_STATEMENT';
        }
        
        // Cursor statements - these should be preserved as-is (check before DECLARE_BLOCK)
        if (upperLine.includes('CURSOR FOR') || 
            upperLine.startsWith('OPEN ') || 
            upperLine.startsWith('FETCH ') || 
            upperLine.startsWith('CLOSE ') || 
            upperLine.startsWith('DEALLOCATE ')) {
            return 'CURSOR_STATEMENT';
        }
        
        // DECLARE statements should be grouped together (but not cursor declarations)
        if (upperLine.startsWith('DECLARE ')) {
            return 'DECLARE_BLOCK';
        }
        
        if ((upperLine.startsWith('SELECT ') || upperLine.startsWith('SELECT')) && !upperLine.includes(' INTO ') && !upperLine.includes(' WITH ')) {
            return 'SIMPLE_SELECT';
        }
        
        // Complex statements that should be preserved
        if (upperLine.startsWith('DROP TABLE') ||
            upperLine.startsWith('DROP TABLE') ||
            upperLine.includes(' INTO #') ||
            upperLine.includes(' INTO @') ||
            upperLine.includes('CREATE ') ||
            upperLine.includes('ALTER ') ||
            upperLine.includes('INSERT ') ||
            upperLine.includes('UPDATE ') ||
            upperLine.includes('DELETE ')) {
            return 'COMPLEX_STATEMENT';
        }

        return 'STATEMENT';
    }

    private isStatementEnd(line: string, lineIndex: number, allLines: string[], currentBlockType: string): boolean {
        const trimmed = line.trim();
        
        // Explicit statement terminators
        if (trimmed.endsWith(';')) {
            return true;
        }
        
        // Check if next non-empty line starts a new statement
        for (let i = lineIndex + 1; i < allLines.length; i++) {
            const nextLine = allLines[i].trim();
            if (!nextLine) continue; // Skip empty lines
            
            if (nextLine.startsWith('--') || nextLine.startsWith('/*')) {
                continue; // Skip comments
            }
            
            const upperNext = nextLine.toUpperCase();
            
            // Special handling for DECLARE blocks - don't end if next line is also DECLARE
            if (currentBlockType === 'DECLARE_BLOCK' && upperNext.startsWith('DECLARE ')) {
                return false; // Continue the DECLARE block
            }
            
            // Special handling for cursor declarations - don't end if current line has "CURSOR FOR" and next is SELECT
            if (currentBlockType === 'CURSOR_STATEMENT' && line.toUpperCase().includes('CURSOR FOR') && upperNext.startsWith('SELECT ')) {
                return false; // The SELECT is part of the cursor declaration
            }
            
            // Don't end cursor statements on subsequent FROM clauses
            if (currentBlockType === 'CURSOR_STATEMENT' && upperNext.startsWith('FROM ')) {
                return false; // The FROM is part of the cursor declaration
            }
            
            if (upperNext.startsWith('SELECT ') ||
                upperNext.startsWith('WITH ') ||
                upperNext.startsWith('INSERT ') ||
                upperNext.startsWith('UPDATE ') ||
                upperNext.startsWith('DELETE ') ||
                upperNext.startsWith('CREATE ') ||
                upperNext.startsWith('ALTER ') ||
                upperNext.startsWith('DROP ') ||
                upperNext.startsWith('DECLARE ') ||
                upperNext.startsWith('OPEN ') ||
                upperNext.startsWith('FETCH ') ||
                upperNext.startsWith('CLOSE ') ||
                upperNext.startsWith('DEALLOCATE ') ||
                upperNext.startsWith('WHILE ') ||
                upperNext.startsWith('BEGIN') ||
                upperNext.startsWith('END')) {
                return true;
            }
            break;
        }
        
        return false;
    }

    private formatSimpleSelect(sql: string): string {
        // Format SELECT statements (handle both single-line and multi-line)
        try {
            // If already multi-line, don't normalize - just format directly
            if (sql.includes('\n')) {
                const keywordFormatted = this.applyKeywordCasing(sql);
                return this.formatSelectStatement(keywordFormatted);
            } else {
                // Single-line SELECT, normalize then format
                const normalized = this.normalizeSql(sql);
                const keywordFormatted = this.applyKeywordCasing(normalized);
                return this.formatSelectStatement(keywordFormatted);
            }
        } catch (error) {
            // If formatting fails, return with basic formatting
            return this.applyBasicFormatting(sql);
        }
    }

    private formatComplexStatement(sql: string): string {
        // For complex statements, preserve structure and only apply keyword casing
        return this.applyKeywordCasing(sql);
    }

    private applyBasicFormatting(sql: string): string {
        // Apply minimal formatting - just keyword casing
        return this.applyKeywordCasing(sql);
    }

    private normalizeSql(sql: string): string {
        // Only normalize for simple statements
        return sql
            .replace(/\r\n/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\n/g, ' ')
            .replace(/\t/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private applyKeywordCasing(sql: string): string {
        if (this.config.keywordCase === 'preserve') return sql;
        
        let result = sql;
        for (const keyword of this.keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const replacement = this.config.keywordCase === 'upper' ? keyword : keyword.toLowerCase();
            result = result.replace(regex, replacement);
        }
        return result;
    }

    private formatSelectStatement(sql: string): string {
        // Parse and format simple SELECT statements
        const components = this.parseSelectComponents(sql);
        const result: string[] = [];

        // Format SELECT clause
        if (components.select) {
            result.push(...this.formatSelectClause(components.select));
        }

        // Format FROM clause with JOINs
        if (components.from) {
            result.push(...this.formatFromClause(components.from));
        }

        // Format WHERE clause
        if (components.where) {
            result.push(...this.formatWhereClause(components.where));
        }

        // Format GROUP BY clause
        if (components.groupBy) {
            result.push(...this.formatGroupByClause(components.groupBy));
        }

        // Format HAVING clause
        if (components.having) {
            result.push(...this.formatHavingClause(components.having));
        }

        // Format ORDER BY clause
        if (components.orderBy) {
            result.push(...this.formatOrderByClause(components.orderBy));
        }

        return result.join('\n');
    }

    private parseSelectComponents(sql: string): {
        select?: string,
        from?: string,
        where?: string,
        groupBy?: string,
        having?: string,
        orderBy?: string
    } {
        const components: any = {};
        
        // We need to carefully track parentheses throughout the entire document
        // to avoid matching ORDER BY inside window functions
        
        let currentPos = 0;
        let parenDepth = 0;
        const clauses: {type: string, start: number, end: number}[] = [];
        
        // Track parentheses throughout the document
        for (let i = 0; i < sql.length; i++) {
            const char = sql[i];
            if (char === '(') {
                parenDepth++;
            } else if (char === ')') {
                parenDepth--;
            }
            
            // Only check for keywords when we're at the top level
            if (parenDepth === 0) {
                // Check if we're at the start of a keyword
                const remaining = sql.substring(i);
                
                let match = null;
                if (remaining.match(/^SELECT\b/i)) {
                    match = { keyword: 'SELECT', length: 6 };
                } else if (remaining.match(/^FROM\b/i)) {
                    match = { keyword: 'FROM', length: 4 };
                } else if (remaining.match(/^WHERE\b/i)) {
                    match = { keyword: 'WHERE', length: 5 };
                } else if (remaining.match(/^GROUP\s+BY\b/i)) {
                    const groupByMatch = remaining.match(/^GROUP\s+BY/i);
                    if (groupByMatch) {
                        match = { keyword: 'GROUP_BY', length: groupByMatch[0].length };
                    }
                } else if (remaining.match(/^HAVING\b/i)) {
                    match = { keyword: 'HAVING', length: 6 };
                } else if (remaining.match(/^ORDER\s+BY\b/i)) {
                    const orderByMatch = remaining.match(/^ORDER\s+BY/i);
                    if (orderByMatch) {
                        match = { keyword: 'ORDER_BY', length: orderByMatch[0].length };
                    }
                }
                
                if (match) {
                    // End the previous clause
                    if (clauses.length > 0) {
                        clauses[clauses.length - 1].end = i;
                    }
                    
                    // Start new clause
                    clauses.push({
                        type: match.keyword,
                        start: i + match.length,
                        end: sql.length
                    });
                    
                    // Skip ahead past this keyword
                    i += match.length - 1; // -1 because the loop will increment
                }
            }
        }
        
        // Extract content for each clause
        for (const clause of clauses) {
            const content = sql.substring(clause.start, clause.end).trim();
            
            switch (clause.type) {
                case 'SELECT':
                    components.select = content;
                    break;
                case 'FROM':
                    components.from = content;
                    break;
                case 'WHERE':
                    components.where = content;
                    break;
                case 'GROUP_BY':
                    components.groupBy = content;
                    break;
                case 'HAVING':
                    components.having = content;
                    break;
                case 'ORDER_BY':
                    components.orderBy = content;
                    break;
            }
        }
        
        return components;
    }

    private formatSelectClause(selectContent: string): string[] {
        const result: string[] = [];
        const columns = this.parseSelectColumns(selectContent);
        
        if (this.config.useRiverFormatting) {
            return this.formatSelectWithRiver(columns);
        } else if (this.config.useIndentFormatting) {
            return this.formatSelectWithIndent(columns);
        } else {
            // Fallback to current formatting
            return this.formatSelectLegacy(columns);
        }
    }

    private formatSelectWithRiver(columns: string[]): string[] {
        const result: string[] = [];
        const riverPos = this.config.riverColumn - 1; // Convert to 0-based index
        
        // Check if we have modifiers like DISTINCT or TOP
        const firstColumn = columns[0]?.trim() || '';
        const hasModifiers = /^(DISTINCT|TOP\s+\d+)/i.test(firstColumn);
        
        if (hasModifiers) {
            // Handle SELECT DISTINCT or SELECT TOP - put first column on its own line
            result.push('SELECT ' + firstColumn.match(/^(DISTINCT|TOP\s+\d+)/i)?.[0]);
            const remainingFirstColumn = firstColumn.replace(/^(DISTINCT|TOP\s+\d+)\s*/i, '');
            
            if (remainingFirstColumn) {
                const padding = ' '.repeat(Math.max(0, riverPos - remainingFirstColumn.length));
                result.push(padding + remainingFirstColumn);
            }
            
            // Process remaining columns
            for (let i = 1; i < columns.length; i++) {
                const column = this.formatComplexColumn(columns[i].trim());
                const padding = ' '.repeat(Math.max(0, riverPos - 1)); // -1 for comma
                result.push(padding + ', ' + column);
            }
        } else {
            // Standard SELECT - first column on same line as SELECT
            if (columns.length > 0) {
                const firstCol = this.formatComplexColumn(columns[0].trim());
                result.push('SELECT ' + firstCol);
                
                // Subsequent columns aligned to river with comma prefix
                for (let i = 1; i < columns.length; i++) {
                    const column = this.formatComplexColumn(columns[i].trim());
                    const padding = ' '.repeat(Math.max(0, riverPos - 1)); // -1 for comma
                    result.push(padding + ', ' + column);
                }
            } else {
                result.push('SELECT');
            }
        }
        
        return result;
    }

    private formatSelectWithIndent(columns: string[]): string[] {
        const result: string[] = [];
        const indent = ' '.repeat(this.config.indentSize);
        
        result.push('SELECT');
        
        for (let i = 0; i < columns.length; i++) {
            const column = this.formatComplexColumn(columns[i].trim());
            
            if (i === 0) {
                result.push(indent + column);
            } else {
                result.push(indent + ',' + column);
            }
        }
        
        return result;
    }

    private formatSelectLegacy(columns: string[]): string[] {
        const result: string[] = [];
        
        result.push('SELECT');
        
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i].trim();
            
            // Format the column using formatComplexColumn (this handles inline comments)
            const formattedColumn = this.formatComplexColumn(column);
            
            if (this.config.commaPosition === 'before') {
                if (i === 0) {
                    // First column aligned with comma position  
                    result.push('      ' + formattedColumn);
                } else {
                    result.push('    , ' + formattedColumn);
                }
            } else {
                if (i === columns.length - 1) {
                    result.push('    ' + formattedColumn);
                } else {
                    result.push('    ' + formattedColumn + ',');
                }
            }
        }
        
        return result;
    }

    private parseSelectColumns(selectContent: string): string[] {
        const columns: string[] = [];
        let currentColumn = '';
        let parenLevel = 0;
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < selectContent.length; i++) {
            const char = selectContent[i];

            // Handle quotes
            if (!inQuotes && (char === "'" || char === '"')) {
                inQuotes = true;
                quoteChar = char;
            } else if (inQuotes && char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            }
            // Handle parentheses
            else if (!inQuotes && char === '(') {
                parenLevel++;
            } else if (!inQuotes && char === ')') {
                parenLevel--;
            }
            // Handle column separation
            else if (!inQuotes && char === ',' && parenLevel === 0) {
                // Look ahead to see if there's a comment immediately after this comma ON THE SAME LINE
                let lookahead = i + 1;
                let afterComma = '';
                
                // Collect only whitespace and comment until newline
                while (lookahead < selectContent.length && selectContent[lookahead] !== '\n') {
                    afterComma += selectContent[lookahead];
                    lookahead++;
                }
                
                // If what follows the comma is only whitespace and a comment, include it
                const afterCommaTrimmed = afterComma.trim();
                if (afterCommaTrimmed.startsWith('--') || afterCommaTrimmed.startsWith('/*')) {
                    // Include the comment with the current column
                    currentColumn += ',' + afterComma;
                    // Add this complete column to the list
                    if (currentColumn.trim()) {
                        columns.push(currentColumn.trim());
                    }
                    currentColumn = '';
                    // Skip past the comment to the newline
                    i = lookahead - 1;
                } else {
                    // Normal column split - no comment after comma
                    if (currentColumn.trim()) {
                        columns.push(currentColumn.trim());
                    }
                    currentColumn = '';
                }
                continue;
            }

            currentColumn += char;
        }

        if (currentColumn.trim()) {
            columns.push(currentColumn.trim());
        }

        return columns;
    }


    
    private parseColumnPart(content: string): string[] {
        const columns: string[] = [];
        let currentColumn = '';
        let parenLevel = 0;
        let inQuotes = false;
        let quoteChar = '';
        let inLineComment = false;

        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            const nextChar = i < content.length - 1 ? content[i + 1] : '';

            // Handle line comments
            if (!inQuotes && !inLineComment && char === '-' && nextChar === '-') {
                inLineComment = true;
                currentColumn += char;
                continue;
            }

            // End of line comment
            if (inLineComment && char === '\n') {
                inLineComment = false;
                currentColumn += char;
                continue;
            }

            // If we're in a line comment, just add the character
            if (inLineComment) {
                currentColumn += char;
                continue;
            }

            if (!inQuotes && (char === "'" || char === '"')) {
                inQuotes = true;
                quoteChar = char;
            } else if (inQuotes && char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            } else if (!inQuotes && char === '(') {
                parenLevel++;
            } else if (!inQuotes && char === ')') {
                parenLevel--;
            } else if (!inQuotes && char === ',' && parenLevel === 0) {
                if (currentColumn.trim()) {
                    // Keep original column for SELECT - formatting will happen in formatSelectLegacy
                    columns.push(currentColumn.trim());
                }
                currentColumn = '';
                continue;
            }

            currentColumn += char;
        }

        if (currentColumn.trim()) {
            // Keep original last column
            columns.push(currentColumn.trim());
        }

        return columns;
    }
    
    private hasCodeBeforeComment(line: string): boolean {
        const commentIndex = line.indexOf('--');
        if (commentIndex === -1) return false;
        
        const beforeComment = line.substring(0, commentIndex).trim();
        return beforeComment.length > 0;
    }

    private formatComplexColumn(column: string): string {
        // Extract inline comment first
        const inlineComment = this.extractInlineComment(column);
        let cleanedColumn = inlineComment.code.trim();
        
        // Remove trailing comma if present (will be handled by comma positioning logic)
        cleanedColumn = cleanedColumn.replace(/,\s*$/, '').trim();
        
        let formattedColumn = cleanedColumn;
        
        // Handle CASE statements
        if (formattedColumn.toUpperCase().includes('CASE ')) {
            formattedColumn = this.formatCaseStatement(formattedColumn);
        }
        
        // Handle window functions - be very restrictive to avoid parsing errors
        // Only process if this looks like a single column with OVER clause
        else if (formattedColumn.toUpperCase().includes(' OVER (') && 
                 !formattedColumn.match(/\b(?:FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|UNION|INSERT|UPDATE|DELETE)\b/i) &&
                 formattedColumn.split('(').length - formattedColumn.split(')').length === 0) { // Balanced parentheses
            formattedColumn = this.formatWindowFunction(formattedColumn);
        }
        
        // Re-attach inline comment with proper spacing if it exists
        if (inlineComment.comment) {
            formattedColumn += '\t' + inlineComment.comment;
        }
        
        return formattedColumn;
    }

    private formatCaseStatement(caseColumn: string): string {
        // Simple regex-based approach for CASE statement formatting
        let formatted = caseColumn;
        
        // Replace CASE with proper line breaks
        formatted = formatted.replace(/\bCASE\s+/gi, 'CASE\n        ');
        
        // Replace WHEN with proper indentation
        formatted = formatted.replace(/\s+WHEN\s+/gi, '\n        WHEN ');
        
        // Replace THEN with proper indentation
        formatted = formatted.replace(/\s+THEN\s+/gi, '\n            THEN ');
        
        // Replace ELSE with proper indentation
        formatted = formatted.replace(/\s+ELSE\s+/gi, '\n        ELSE ');
        
        // Replace END with proper indentation
        formatted = formatted.replace(/\s+END\b/gi, '\n    END');
        
        // Clean up extra whitespace and normalize spacing
        formatted = formatted.replace(/\n\s*\n/g, '\n');
        formatted = formatted.replace(/^\s+/, ''); // Remove leading whitespace
        
        return formatted;
    }

    private formatWindowFunction(windowColumn: string): string {
        // Find the OVER clause position using more precise matching
        const upperColumn = windowColumn.toUpperCase();
        const overIndex = upperColumn.indexOf(' OVER (');
        
        if (overIndex === -1) return windowColumn;
        
        const functionPart = windowColumn.substring(0, overIndex).trim();
        
        // Find matching closing parenthesis for OVER clause using parentheses counting
        let parenCount = 1; // We start after the opening parenthesis
        let overStart = overIndex + 7; // Position after ' OVER ('
        let overEnd = -1;
        
        for (let i = overStart; i < windowColumn.length; i++) {
            if (windowColumn[i] === '(') {
                parenCount++;
            } else if (windowColumn[i] === ')') {
                parenCount--;
                if (parenCount === 0) {
                    overEnd = i;
                    break;
                }
            }
        }
        
        if (overEnd === -1) return windowColumn; // Unmatched parentheses
        
        const overContent = windowColumn.substring(overStart, overEnd).trim();
        const remainder = windowColumn.substring(overEnd + 1).trim();
        
        if (this.config.useRiverFormatting) {
            return this.formatWindowFunctionWithRiver(functionPart, overContent, remainder);
        } else {
            return this.formatWindowFunctionLegacy(functionPart, overContent, remainder);
        }
    }

    private formatWindowFunctionWithRiver(functionPart: string, overContent: string, remainder: string): string {
        const riverPos = this.config.riverColumn - 1;
        
        // Format the OVER clause content
        const formattedOverContent = this.formatOverClauseContent(overContent);
        
        // River-aligned window function formatting
        let result = functionPart + '\n';
        
        // OVER aligned to river
        const overPadding = ' '.repeat(Math.max(0, riverPos - 4)); // 4 = length of "OVER"
        result += overPadding + 'OVER (';
        
        if (formattedOverContent) {
            // Parse OVER content and align to river
            const overLines = formattedOverContent.split('\n');
            for (const line of overLines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('PARTITION BY')) {
                    const partitionPadding = ' '.repeat(Math.max(0, riverPos - 12)); // 12 = length of "PARTITION BY"
                    result += '\n' + partitionPadding + trimmedLine;
                } else if (trimmedLine.startsWith('ORDER BY')) {
                    const orderPadding = ' '.repeat(Math.max(0, riverPos - 8)); // 8 = length of "ORDER BY"
                    result += '\n' + orderPadding + trimmedLine;
                } else if (trimmedLine) {
                    const generalPadding = ' '.repeat(Math.max(0, riverPos));
                    result += '\n' + generalPadding + trimmedLine;
                }
            }
            const closePadding = ' '.repeat(Math.max(0, riverPos - 1));
            result += '\n' + closePadding + ')';
        } else {
            result += ')';
        }
        
        // Add any remainder (like AS alias)
        if (remainder) {
            result += ' ' + remainder;
        }
        
        return result;
    }

    private formatWindowFunctionLegacy(functionPart: string, overContent: string, remainder: string): string {
        // Format the OVER clause content
        const formattedOverContent = this.formatOverClauseContent(overContent);
        
        let result = functionPart + '\n        OVER (';
        
        if (formattedOverContent) {
            result += '\n            ' + formattedOverContent;
            result += '\n        )';
        } else {
            result += ')';
        }
        
        // Add any remainder (like AS alias)
        if (remainder) {
            result += ' ' + remainder;
        }
        
        return result;
    }

    private formatOverClauseContent(content: string): string {
        let formatted = content;
        const lines: string[] = [];
        
        // Base indentation for content inside OVER()
        const baseIndent = '                               ';
        
        // More restrictive parsing to stay within the OVER clause
        let remaining = formatted;
        
        // Handle PARTITION BY (only window function specific, not general SQL)
        const partitionMatch = remaining.match(/^(\s*)(PARTITION\s+BY\s+[^,)]+?)(?=\s+ORDER\s+BY|\s+ROWS\s+BETWEEN|\s*$)/i);
        if (partitionMatch) {
            const [, before, partitionClause] = partitionMatch;
            if (before.trim()) {
                lines.push(baseIndent + before.trim());
            }
            lines.push(baseIndent + partitionClause.replace(/\s+/g, ' ').trim());
            remaining = remaining.substring((before + partitionClause).length);
        }
        
        // Handle ORDER BY (only window function specific)
        const orderMatch = remaining.match(/^(\s*)(ORDER\s+BY\s+[^,)]+?)(?=\s+ROWS\s+BETWEEN|\s*$)/i);
        if (orderMatch) {
            const [, before, orderClause] = orderMatch;
            if (before.trim()) {
                lines.push(baseIndent + before.trim());
            }
            lines.push(baseIndent + orderClause.replace(/\s+/g, ' ').trim());
            remaining = remaining.substring((before + orderClause).length);
        }
        
        // Handle ROWS/RANGE clauses (only at the end)
        const rowsMatch = remaining.match(/^(\s*)((?:ROWS|RANGE)\s+BETWEEN\s+.+?)$/i);
        if (rowsMatch) {
            const [, before, rowsClause] = rowsMatch;
            if (before.trim()) {
                lines.push(baseIndent + before.trim());
            }
            lines.push(baseIndent + rowsClause.replace(/\s+/g, ' ').trim());
            remaining = '';
        }
        
        // Handle any remaining content (but be cautious)
        if (remaining.trim() && !remaining.match(/\b(?:FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|UNION)\b/i)) {
            lines.push(baseIndent + remaining.trim());
        }
        
        // If no specific clauses found, just indent the whole content
        if (lines.length === 0) {
            lines.push(baseIndent + content.replace(/\s+/g, ' ').trim());
        }
        
        return lines.join('\n');
    }

    private formatFromClause(fromContent: string): string[] {
        const result: string[] = [];
        
        // Parse FROM and all JOINs
        const fromParts = this.parseFromWithJoins(fromContent);
        
        if (this.config.useRiverFormatting) {
            return this.formatFromWithRiver(fromParts);
        } else if (this.config.useIndentFormatting) {
            return this.formatFromWithIndent(fromParts);
        } else {
            return this.formatFromLegacy(fromParts);
        }
    }

    private formatFromWithRiver(fromParts: Array<{type: string, joinType?: string, table: string, conditions?: string[]}>): string[] {
        const result: string[] = [];
        const riverPos = this.config.riverColumn - 1;
        
        for (const part of fromParts) {
            if (part.type === 'FROM') {
                // FROM aligned to river (start at riverColumn position)
                const padding = ' '.repeat(Math.max(0, riverPos));
                result.push(padding + 'FROM ' + part.table);
            } else if (part.type === 'JOIN') {
                // Preserve original join type (INNER JOIN, LEFT JOIN, etc.)
                let joinType = part.joinType || 'JOIN';
                joinType = joinType.trim();
                
                // Align JOIN to river (start at riverColumn position)
                const padding = ' '.repeat(Math.max(0, riverPos));
                result.push(padding + joinType + ' ' + part.table);
                
                // Format ON conditions aligned to river
                if (part.conditions && part.conditions.length > 0) {
                    for (let i = 0; i < part.conditions.length; i++) {
                        const condition = part.conditions[i];
                        if (i === 0) {
                            const onPadding = ' '.repeat(Math.max(0, riverPos - 2)); // 2 = length of "ON"
                            result.push(onPadding + 'ON ' + condition);
                        } else {
                            const andPadding = ' '.repeat(Math.max(0, riverPos - 3)); // 3 = length of "AND"
                            result.push(andPadding + condition);
                        }
                    }
                }
            }
        }
        
        return result;
    }

    private formatFromWithIndent(fromParts: Array<{type: string, joinType?: string, table: string, conditions?: string[]}>): string[] {
        const result: string[] = [];
        const indent = ' '.repeat(this.config.indentSize);
        
        for (const part of fromParts) {
            if (part.type === 'FROM') {
                result.push('FROM');
                result.push(indent + part.table);
            } else if (part.type === 'JOIN') {
                // Preserve original join type (INNER JOIN, LEFT JOIN, etc.)
                let joinType = part.joinType || 'JOIN';
                joinType = joinType.trim();
                
                result.push(indent + joinType + ' ' + part.table);
                
                // Format ON conditions
                if (part.conditions && part.conditions.length > 0) {
                    for (let i = 0; i < part.conditions.length; i++) {
                        const condition = part.conditions[i];
                        if (i === 0) {
                            result.push(indent + indent + 'ON ' + condition);
                        } else {
                            result.push(indent + indent + condition);
                        }
                    }
                }
            }
        }
        
        return result;
    }

    private formatFromLegacy(fromParts: Array<{type: string, joinType?: string, table: string, conditions?: string[]}>): string[] {
        const result: string[] = [];
        
        for (const part of fromParts) {
            if (part.type === 'FROM') {
                result.push('FROM ' + part.table);
            } else if (part.type === 'JOIN') {
                // Format JOIN
                result.push('    ' + part.joinType + ' ' + part.table);
                
                // Format ON conditions with proper AND/OR handling
                if (part.conditions && part.conditions.length > 0) {
                    for (let i = 0; i < part.conditions.length; i++) {
                        const condition = part.conditions[i];
                        if (i === 0) {
                            result.push('        ON ' + condition);
                        } else {
                            result.push('        ' + condition);
                        }
                    }
                }
            }
        }
        
        return result;
    }

    private parseFromWithJoins(fromContent: string): Array<{
        type: string,
        joinType?: string,
        table: string,
        conditions?: string[]
    }> {
        const parts: Array<{type: string, joinType?: string, table: string, conditions?: string[]}> = [];
        
        // Split on JOIN keywords
        const joinRegex = /((?:INNER|LEFT|RIGHT|FULL|CROSS)?\s*(?:OUTER\s+)?JOIN)/gi;
        const sections = fromContent.split(joinRegex).filter(s => s.trim());
        
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i].trim();
            
            if (/^(INNER|LEFT|RIGHT|FULL|CROSS)?\s*(?:OUTER\s+)?JOIN$/i.test(section)) {
                // This is a JOIN keyword, combine with next section
                if (i + 1 < sections.length) {
                    const joinContent = sections[i + 1].trim();
                    const joinInfo = this.parseJoinClause(section, joinContent);
                    parts.push(joinInfo);
                    i++; // Skip the next section as we've processed it
                }
            } else if (i === 0) {
                // First section is the FROM table
                parts.push({type: 'FROM', table: section});
            }
        }
        
        return parts;
    }

    private parseJoinClause(joinKeyword: string, joinContent: string): {
        type: string,
        joinType: string,
        table: string,
        conditions?: string[]
    } {
        const onIndex = joinContent.toUpperCase().indexOf(' ON ');
        
        if (onIndex > -1) {
            const table = joinContent.substring(0, onIndex).trim();
            const conditionsStr = joinContent.substring(onIndex + 4).trim();
            const conditions = this.parseLogicalConditions(conditionsStr);
            
            return {
                type: 'JOIN',
                joinType: joinKeyword.trim(),
                table: table,
                conditions: conditions
            };
        } else {
            return {
                type: 'JOIN',
                joinType: joinKeyword.trim(),
                table: joinContent
            };
        }
    }

    private formatWhereClause(whereContent: string): string[] {
        if (this.config.useRiverFormatting) {
            return this.formatWhereWithRiver(whereContent);
        } else if (this.config.useIndentFormatting) {
            return this.formatWhereWithIndent(whereContent);
        } else {
            return this.formatWhereLegacy(whereContent);
        }
    }

    private formatWhereWithRiver(whereContent: string): string[] {
        const result: string[] = [];
        const riverPos = this.config.riverColumn - 1;
        
        // Split WHERE conditions by AND/OR
        const conditions = this.parseWhereConditions(whereContent);
        
        // WHERE aligned to river (start at riverColumn position)
        const wherePadding = ' '.repeat(Math.max(0, riverPos));
        
        if (conditions.length > 0) {
            result.push(wherePadding + 'WHERE ' + conditions[0]);
            
            // Additional conditions aligned to river with AND/OR
            for (let i = 1; i < conditions.length; i++) {
                const condition = conditions[i];
                const operator = condition.startsWith('OR ') ? 'OR' : 'AND';
                const conditionText = condition.replace(/^(AND|OR)\s+/i, '');
                
                const operatorPadding = ' '.repeat(Math.max(0, riverPos - operator.length));
                result.push(operatorPadding + operator + ' ' + conditionText);
            }
        } else {
            result.push(wherePadding + 'WHERE ' + whereContent);
        }
        
        return result;
    }

    private formatWhereWithIndent(whereContent: string): string[] {
        const result: string[] = [];
        const indent = ' '.repeat(this.config.indentSize);
        
        const conditions = this.parseWhereConditions(whereContent);
        
        result.push('WHERE');
        
        if (conditions.length > 0) {
            result.push(indent + conditions[0]);
            
            for (let i = 1; i < conditions.length; i++) {
                const condition = conditions[i];
                result.push(indent + condition);
            }
        } else {
            result.push(indent + whereContent);
        }
        
        return result;
    }

    private formatWhereLegacy(whereContent: string): string[] {
        const result: string[] = [];
        
        // Use the enhanced WHERE AND formatting
        const formattedWhere = this.formatWhereAndConditions('WHERE ' + whereContent);
        const lines = formattedWhere.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                result.push(trimmedLine);
            }
        }
        
        return result;
    }

    private parseWhereConditions(whereContent: string): string[] {
        // Simple parsing of WHERE conditions split by AND/OR
        const conditions: string[] = [];
        let currentCondition = '';
        let parenLevel = 0;
        let inQuotes = false;
        let quoteChar = '';
        
        const tokens = whereContent.split(/(\s+(?:AND|OR)\s+)/i);
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (i === 0) {
                conditions.push(token.trim());
            } else if (/^\s*(AND|OR)\s+$/i.test(token)) {
                // This is an AND/OR operator
                const operator = token.trim();
                if (i + 1 < tokens.length) {
                    conditions.push(operator + ' ' + tokens[i + 1].trim());
                    i++; // Skip the next token since we already processed it
                }
            }
        }
        
        return conditions.filter(c => c.trim());
    }

    private formatOrderByClause(orderByContent: string): string[] {
        if (this.config.useRiverFormatting) {
            return this.formatOrderByWithRiver(orderByContent);
        } else if (this.config.useIndentFormatting) {
            return this.formatOrderByWithIndent(orderByContent);
        } else {
            return this.formatOrderByLegacy(orderByContent);
        }
    }

    private formatOrderByWithRiver(orderByContent: string): string[] {
        const result: string[] = [];
        const riverPos = this.config.riverColumn - 1;
        
        // Split ORDER BY columns by comma
        const columns = orderByContent.split(',').map(c => c.trim().replace(/\s+ASC$/i, '')); // Remove unnecessary ASC
        
        // ORDER BY aligned to river (start at riverColumn position)
        const orderByPadding = ' '.repeat(Math.max(0, riverPos));
        
        if (columns.length <= 3 && columns.every(c => c.length <= 20)) {
            // Short columns on same line
            result.push(orderByPadding + 'ORDER BY ' + columns.join(', '));
        } else {
            // Multi-line with river alignment
            if (columns.length > 0) {
                result.push(orderByPadding + 'ORDER BY ' + columns[0]);
                
                for (let i = 1; i < columns.length; i++) {
                    const column = columns[i];
                    const commaPadding = ' '.repeat(Math.max(0, riverPos - 1)); // -1 for comma
                    result.push(commaPadding + ', ' + column);
                }
            } else {
                result.push(orderByPadding + 'ORDER BY ' + orderByContent);
            }
        }
        
        return result;
    }

    private formatOrderByWithIndent(orderByContent: string): string[] {
        const result: string[] = [];
        const indent = ' '.repeat(this.config.indentSize);
        
        const columns = orderByContent.split(',').map(c => c.trim().replace(/\s+ASC$/i, ''));
        
        result.push('ORDER BY');
        
        for (const column of columns) {
            result.push(indent + column);
        }
        
        return result;
    }

    private formatOrderByLegacy(orderByContent: string): string[] {
        const result: string[] = [];
        
        // Split ORDER BY columns by comma
        const columns = orderByContent.split(',');
        
        result.push('ORDER BY');
        
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i].trim();
            if (this.config.commaPosition === 'before') {
                if (i === 0) {
                    // First column aligned with comma position
                    result.push('      ' + column);
                } else {
                    result.push('    , ' + column);
                }
            } else {
                if (i === columns.length - 1) {
                    result.push('    ' + column);
                } else {
                    result.push('    ' + column + ',');
                }
            }
        }
        
        return result;
    }

    private parseLogicalConditions(conditionsStr: string): string[] {
        const conditions: string[] = [];
        let currentCondition = '';
        let parenLevel = 0;
        let inQuotes = false;
        let quoteChar = '';
        let i = 0;

        while (i < conditionsStr.length) {
            const char = conditionsStr[i];
            
            // Handle quotes
            if (!inQuotes && (char === "'" || char === '"')) {
                inQuotes = true;
                quoteChar = char;
            } else if (inQuotes && char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            }
            
            // Handle parentheses
            if (!inQuotes && char === '(') {
                parenLevel++;
            } else if (!inQuotes && char === ')') {
                parenLevel--;
            }
            
            // Look for AND/OR at the top level
            if (!inQuotes && parenLevel === 0) {
                const remainingStr = conditionsStr.substring(i);
                
                if (remainingStr.toUpperCase().startsWith('AND ')) {
                    if (currentCondition.trim()) {
                        conditions.push(currentCondition.trim());
                    }
                    currentCondition = 'AND ';
                    i += 3; // Skip 'AND'
                    continue;
                } else if (remainingStr.toUpperCase().startsWith('OR ')) {
                    if (currentCondition.trim()) {
                        conditions.push(currentCondition.trim());
                    }
                    currentCondition = 'OR ';
                    i += 2; // Skip 'OR'
                    continue;
                }
            }
            
            currentCondition += char;
            i++;
        }

        if (currentCondition.trim()) {
            conditions.push(currentCondition.trim());
        }

        return conditions;
    }

    private formatGroupByClause(groupByContent: string): string[] {
        if (this.config.useRiverFormatting) {
            return this.formatGroupByWithRiver(groupByContent);
        } else if (this.config.useIndentFormatting) {
            return this.formatGroupByWithIndent(groupByContent);
        } else {
            return this.formatGroupByLegacy(groupByContent);
        }
    }

    private formatGroupByWithRiver(groupByContent: string): string[] {
        const result: string[] = [];
        const riverPos = this.config.riverColumn - 1;
        const columns = groupByContent.split(',').map(col => col.trim()).filter(col => col);
        
        // GROUP BY aligned to river (start at riverColumn position)
        const groupByPadding = ' '.repeat(Math.max(0, riverPos));
        
        if (columns.length > 0) {
            result.push(groupByPadding + 'GROUP BY ' + columns[0]);
            
            for (let i = 1; i < columns.length; i++) {
                const column = columns[i];
                const commaPadding = ' '.repeat(Math.max(0, riverPos - 1)); // -1 for comma
                result.push(commaPadding + ', ' + column);
            }
        } else {
            result.push(groupByPadding + 'GROUP BY ' + groupByContent);
        }
        
        return result;
    }

    private formatGroupByWithIndent(groupByContent: string): string[] {
        const result: string[] = [];
        const indent = ' '.repeat(this.config.indentSize);
        const columns = groupByContent.split(',').map(col => col.trim()).filter(col => col);
        
        result.push('GROUP BY');
        
        for (const column of columns) {
            result.push(indent + column);
        }
        
        return result;
    }

    private formatGroupByLegacy(groupByContent: string): string[] {
        const result: string[] = [];
        const columns = groupByContent.split(',').map(col => col.trim()).filter(col => col);
        
        result.push('GROUP BY');
        
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            if (i === 0) {
                // First column aligned with comma position
                result.push('      ' + column);
            } else {
                result.push('    , ' + column);
            }
        }
        
        return result;
    }

    private formatHavingClause(havingContent: string): string[] {
        if (this.config.useRiverFormatting) {
            return this.formatHavingWithRiver(havingContent);
        } else if (this.config.useIndentFormatting) {
            return this.formatHavingWithIndent(havingContent);
        } else {
            return this.formatHavingLegacy(havingContent);
        }
    }

    private formatHavingWithRiver(havingContent: string): string[] {
        const result: string[] = [];
        const riverPos = this.config.riverColumn - 1;
        
        // Parse HAVING conditions similar to WHERE
        const conditions = this.parseWhereConditions(havingContent);
        
        // HAVING aligned to river (start at riverColumn position)
        const havingPadding = ' '.repeat(Math.max(0, riverPos));
        
        if (conditions.length > 0) {
            result.push(havingPadding + 'HAVING ' + conditions[0]);
            
            // Additional conditions aligned to river with AND/OR
            for (let i = 1; i < conditions.length; i++) {
                const condition = conditions[i];
                const operator = condition.startsWith('OR ') ? 'OR' : 'AND';
                const conditionText = condition.replace(/^(AND|OR)\s+/i, '');
                
                const operatorPadding = ' '.repeat(Math.max(0, riverPos - operator.length));
                result.push(operatorPadding + operator + ' ' + conditionText);
            }
        } else {
            result.push(havingPadding + 'HAVING ' + havingContent);
        }
        
        return result;
    }

    private formatHavingWithIndent(havingContent: string): string[] {
        const result: string[] = [];
        const indent = ' '.repeat(this.config.indentSize);
        
        const conditions = this.parseWhereConditions(havingContent);
        
        result.push('HAVING');
        
        if (conditions.length > 0) {
            result.push(indent + conditions[0]);
            
            for (let i = 1; i < conditions.length; i++) {
                const condition = conditions[i];
                result.push(indent + condition);
            }
        } else {
            result.push(indent + havingContent);
        }
        
        return result;
    }

    private formatHavingLegacy(havingContent: string): string[] {
        return ['HAVING ' + havingContent];
    }

    private formatCteStatement(sql: string): string {
        // Handle CTE (Common Table Expression) formatting
        try {
            let formatted = this.applyKeywordCasing(sql);
            
            // Format the CTE structure
            formatted = this.formatCteStructure(formatted);
            
            return formatted;
        } catch (error) {
            // If CTE formatting fails, return with basic formatting
            return this.applyBasicFormatting(sql);
        }
    }

    private formatCursorStatement(sql: string): string {
        // Handle cursor statements with minimal formatting to preserve syntax
        try {
            // For cursor statements, we want to preserve the structure completely
            // Just apply keyword casing and clean up whitespace
            let formatted = this.applyKeywordCasing(sql);
            
            // Clean up extra whitespace but preserve line structure
            const lines = formatted.split(/\r?\n/);
            const result: string[] = [];
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed) {
                    // Clean up multiple spaces but preserve structure
                    const cleaned = trimmed.replace(/\s+/g, ' ');
                    result.push(cleaned);
                } else {
                    result.push('');
                }
            }
            
            return result.join('\n');
        } catch (error) {
            // If cursor formatting fails, return original content unchanged
            return sql;
        }
    }

    private formatCteStructure(sql: string): string {
        let result = sql;
        
        // Handle ;WITH at the beginning
        result = result.replace(/^;?\s*WITH\s+/i, ';WITH ');
        
        // Handle AS ( - ensure proper line breaks
        result = result.replace(/\s+AS\s*\(\s*/gi, '\nAS (\n');
        
        // Handle UNION ALL with proper spacing
        result = result.replace(/\s+UNION\s+ALL\s+/gi, '\n\nUNION ALL\n\n');
        
        // Handle OPTION clause on new line
        result = result.replace(/\s+OPTION\s*\(/gi, '\nOPTION (');
        
        // Improve WHERE AND formatting
        result = this.formatWhereAndConditions(result);
        
        return result;
    }

    private formatWhereAndConditions(sql: string): string {
        // Enhanced WHERE/AND formatting for better readability with comment preservation
        let result = sql;
        
        // Split by lines to handle each line individually
        const lines = result.split(/\r?\n/);
        const formattedLines: string[] = [];
        
        for (const line of lines) {
            const inlineComment = this.extractInlineComment(line);
            let codePart = inlineComment.code;
            
            // Apply AND/OR formatting to code part only
            codePart = codePart.replace(/\bWHERE\s+/gi, 'WHERE ');
            codePart = codePart.replace(/\s+AND\s+/gi, '\n    AND ');
            codePart = codePart.replace(/\s+OR\s+/gi, '\n    OR ');
            
            // Split the formatted code and re-attach comments
            const codeLines = codePart.split('\n');
            if (codeLines.length > 1 && inlineComment.comment) {
                // Comment goes with the first line before splitting
                formattedLines.push(codeLines[0] + '\t' + inlineComment.comment);
                // Add remaining lines without comment
                for (let i = 1; i < codeLines.length; i++) {
                    formattedLines.push(codeLines[i]);
                }
            } else if (inlineComment.comment) {
                formattedLines.push(codePart + '\t' + inlineComment.comment);
            } else {
                formattedLines.push(codePart);
            }
        }
        
        return formattedLines.join('\n');
    }

    private formatComments(sql: string): string {
        const lines = sql.split(/\r?\n/);
        const formattedLines: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Check for inline comments (-- or /* */)
            if (this.hasInlineComment(line)) {
                // Format inline comments with proper spacing
                formattedLines.push(this.formatInlineComment(line));
            } else {
                // Regular line - no comment formatting needed
                formattedLines.push(line);
            }
        }
        
        return formattedLines.join('\n');
    }

    private hasInlineComment(line: string): boolean {
        const trimmedLine = line.trim();
        
        // Skip if the line starts with a comment (standalone comment)
        if (trimmedLine.startsWith('--') || trimmedLine.startsWith('/*')) {
            return false;
        }
        
        // Check for inline -- comment
        const lineCommentIndex = line.indexOf('--');
        if (lineCommentIndex > 0) {
            // Make sure it's not inside quotes
            const beforeComment = line.substring(0, lineCommentIndex);
            const singleQuotes = (beforeComment.match(/'/g) || []).length;
            const doubleQuotes = (beforeComment.match(/"/g) || []).length;
            
            // If we have an even number of quotes, the comment is not inside a string
            return singleQuotes % 2 === 0 && doubleQuotes % 2 === 0;
        }
        
        // Check for inline /* */ comment
        const blockCommentStart = line.indexOf('/*');
        if (blockCommentStart > 0 && line.includes('*/')) {
            const beforeComment = line.substring(0, blockCommentStart);
            const singleQuotes = (beforeComment.match(/'/g) || []).length;
            const doubleQuotes = (beforeComment.match(/"/g) || []).length;
            
            return singleQuotes % 2 === 0 && doubleQuotes % 2 === 0;
        }
        
        return false;
    }

    private formatInlineComment(line: string): string {
        // Format -- inline comments
        let result = line;
        const lineCommentIndex = result.indexOf('--');
        if (lineCommentIndex > 0) {
            const beforeComment = result.substring(0, lineCommentIndex).trimEnd();
            const comment = result.substring(lineCommentIndex);
            result = beforeComment + '\t' + comment;
        }
        
        // Format /* */ inline comments
        const blockCommentStart = result.indexOf('/*');
        if (blockCommentStart > 0 && result.includes('*/')) {
            const beforeComment = result.substring(0, blockCommentStart).trimEnd();
            const commentPart = result.substring(blockCommentStart);
            result = beforeComment + '\t' + commentPart;
        }
        
        return result;
    }

    private isStandaloneComment(content: string): boolean {
        const lines = content.split(/\r?\n/);
        
        // Check if all lines are comments or empty
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('--') && !trimmedLine.startsWith('/*') && !trimmedLine.endsWith('*/')) {
                return false;
            }
        }
        
        return true;
    }

    private extractInlineComment(line: string): { code: string, comment: string } {
        // Extract inline comments from a line of code
        let code = line;
        let comment = '';
        
        // Handle -- comments
        const lineCommentIndex = line.indexOf('--');
        if (lineCommentIndex > 0) {
            // Make sure it's not inside quotes
            const beforeComment = line.substring(0, lineCommentIndex);
            const singleQuotes = (beforeComment.match(/'/g) || []).length;
            const doubleQuotes = (beforeComment.match(/"/g) || []).length;
            
            // If we have an even number of quotes, the comment is not inside a string
            if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
                code = beforeComment.trimEnd();
                comment = line.substring(lineCommentIndex);
                return { code, comment };
            }
        }
        
        // Handle /* */ comments inline (single line block comments)
        const blockCommentStart = line.indexOf('/*');
        if (blockCommentStart > 0 && line.includes('*/')) {
            const blockCommentEnd = line.indexOf('*/') + 2;
            const beforeComment = line.substring(0, blockCommentStart);
            const singleQuotes = (beforeComment.match(/'/g) || []).length;
            const doubleQuotes = (beforeComment.match(/"/g) || []).length;
            
            if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
                const commentPart = line.substring(blockCommentStart, blockCommentEnd);
                const afterComment = line.substring(blockCommentEnd);
                code = (beforeComment + afterComment).trim();
                comment = commentPart;
                return { code, comment };
            }
        }
        
        return { code, comment };
    }

    private isCommentPartOfStatement(currentBlock: string, blockType: string, currentLineIndex: number, lines: string[]): boolean {
        // If we're already in a SQL statement block, the comment is likely part of it
        if (blockType === 'SIMPLE_SELECT' || blockType === 'COMPLEX_STATEMENT' || blockType === 'CTE_STATEMENT') {
            return true;
        }
        
        // If current block has SELECT, INSERT, UPDATE, DELETE, or other SQL keywords, comment is part of statement
        if (currentBlock.trim()) {
            const blockUpper = currentBlock.toUpperCase();
            if (blockUpper.includes('SELECT') || blockUpper.includes('INSERT') || 
                blockUpper.includes('UPDATE') || blockUpper.includes('DELETE') ||
                blockUpper.includes('CREATE') || blockUpper.includes('ALTER') ||
                blockUpper.includes('WITH') || blockUpper.includes('DECLARE')) {
                return true;
            }
        }
        
        // Look ahead to see if the next non-empty, non-comment line continues the SQL statement
        for (let i = currentLineIndex + 1; i < lines.length; i++) {
            const nextLine = lines[i].trim();
            
            // Skip empty lines and other comments
            if (!nextLine || nextLine.startsWith('--') || nextLine.startsWith('/*')) {
                continue;
            }
            
            // Check if the next line looks like a continuation of a SQL statement
            const nextLineUpper = nextLine.toUpperCase();
            if (nextLineUpper.startsWith('CASE') || nextLineUpper.startsWith('WHEN') ||
                nextLineUpper.startsWith('FROM') || nextLineUpper.startsWith('WHERE') ||
                nextLineUpper.startsWith('JOIN') || nextLineUpper.startsWith('INNER') ||
                nextLineUpper.startsWith('LEFT') || nextLineUpper.startsWith('RIGHT') ||
                nextLineUpper.startsWith('GROUP') || nextLineUpper.startsWith('ORDER') ||
                nextLineUpper.startsWith('HAVING') || nextLineUpper.startsWith('UNION') ||
                nextLineUpper.startsWith('END') || nextLineUpper.includes('THEN') ||
                nextLineUpper.includes('ELSE') || nextLine.includes(',')) {
                return true;
            }
            
            // If we find a clear start of a new statement, this comment is standalone
            if (nextLineUpper.startsWith('SELECT') || nextLineUpper.startsWith('INSERT') ||
                nextLineUpper.startsWith('UPDATE') || nextLineUpper.startsWith('DELETE') ||
                nextLineUpper.startsWith('CREATE') || nextLineUpper.startsWith('ALTER') ||
                nextLineUpper.startsWith('DROP') || nextLineUpper.startsWith('WITH')) {
                return false;
            }
            
            // If we encounter any other code, assume it's part of the current statement
            return true;
        }
        
        // If we can't determine, assume it's standalone to be safe
        return false;
    }
}