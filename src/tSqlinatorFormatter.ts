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
        'DEFAULT', 'IDENTITY', 'AUTO_INCREMENT', 'WITH', 'CTE', 'RECURSIVE'
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

            // Handle line comments - group consecutive comments together
            if (trimmedLine.startsWith('--')) {
                // If we have an active block, save it first
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
        
        // DECLARE statements should be grouped together
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
            
            if (upperNext.startsWith('SELECT ') ||
                upperNext.startsWith('WITH ') ||
                upperNext.startsWith('INSERT ') ||
                upperNext.startsWith('UPDATE ') ||
                upperNext.startsWith('DELETE ') ||
                upperNext.startsWith('CREATE ') ||
                upperNext.startsWith('ALTER ') ||
                upperNext.startsWith('DROP ') ||
                upperNext.startsWith('DECLARE ')) {
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
            result.push('HAVING ' + components.having);
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
        
        result.push('SELECT');
        
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i].trim();
            
            // Format the column using formatComplexColumn
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
                    columns.push(currentColumn.trim());
                }
                currentColumn = '';
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

        for (let i = 0; i < content.length; i++) {
            const char = content[i];

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
                    // Format the column before adding it
                    const formattedColumn = this.formatComplexColumn(currentColumn.trim());
                    columns.push(formattedColumn);
                }
                currentColumn = '';
                continue;
            }

            currentColumn += char;
        }

        if (currentColumn.trim()) {
            // Format the last column
            const formattedColumn = this.formatComplexColumn(currentColumn.trim());
            columns.push(formattedColumn);
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
        
        // Re-attach inline comment with proper spacing
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

    private formatOrderByClause(orderByContent: string): string[] {
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
}