/**
 * Enterprise SQL Formatter - Safe Multi-Statement Handler
 * Designed to handle complex scripts without destroying code
 */

interface RedgateSqlPromptConfig {
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

export class RedgateSqlFormatter {
    private config: RedgateSqlPromptConfig;
    
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

    constructor(userConfig?: Partial<RedgateSqlPromptConfig>) {
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
                if (block.type === 'COMMENT') {
                    // Preserve comments exactly as they are
                    formattedBlocks.push(block.content);
                } else if (block.type === 'LINE_COMMENT') {
                    // For grouped line comments, preserve them and add one line break after
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

            // Join blocks intelligently - don't add extra spacing around comments
            const result: string[] = [];
            for (let i = 0; i < formattedBlocks.length; i++) {
                const block = blocks[i];
                const content = formattedBlocks[i];
                
                if (i > 0) {
                    // Check if previous or current block is a comment
                    const previousBlock = blocks[i - 1];
                    const isComment = block.type === 'LINE_COMMENT' || block.type === 'COMMENT';
                    const wasPreviousComment = previousBlock.type === 'LINE_COMMENT' || previousBlock.type === 'COMMENT';
                    
                    if (isComment || wasPreviousComment) {
                        // Only single line break for comments
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
        
        if (upperLine.startsWith('SELECT ') && !upperLine.includes(' INTO ') && !upperLine.includes(' WITH ')) {
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
        // Only format simple SELECT statements
        try {
            const normalized = this.normalizeSql(sql);
            const keywordFormatted = this.applyKeywordCasing(normalized);
            return this.formatSelectStatement(keywordFormatted);
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
            result.push('ORDER BY ' + components.orderBy);
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

        // Simple regex parsing for basic SELECT statements
        const selectMatch = sql.match(/^SELECT\s+(.*?)(?=\s+FROM|\s*$)/i);
        if (selectMatch) {
            components.select = selectMatch[1].trim();
        }

        const fromMatch = sql.match(/\bFROM\s+(.*?)(?=\s+WHERE|\s+GROUP\s+BY|\s+ORDER\s+BY|\s+HAVING|\s*$)/i);
        if (fromMatch) {
            components.from = fromMatch[1].trim();
        }

        const whereMatch = sql.match(/\bWHERE\s+(.*?)(?=\s+GROUP\s+BY|\s+ORDER\s+BY|\s+HAVING|\s*$)/i);
        if (whereMatch) {
            components.where = whereMatch[1].trim();
        }

        const groupByMatch = sql.match(/\bGROUP\s+BY\s+(.*?)(?=\s+ORDER\s+BY|\s+HAVING|\s*$)/i);
        if (groupByMatch) {
            components.groupBy = groupByMatch[1].trim();
        }

        const havingMatch = sql.match(/\bHAVING\s+(.*?)(?=\s+ORDER\s+BY|\s*$)/i);
        if (havingMatch) {
            components.having = havingMatch[1].trim();
        }

        const orderByMatch = sql.match(/\bORDER\s+BY\s+(.*?)$/i);
        if (orderByMatch) {
            components.orderBy = orderByMatch[1].trim();
        }

        return components;
    }

    private formatSelectClause(selectContent: string): string[] {
        const result: string[] = [];
        const columns = this.parseSelectColumns(selectContent);
        
        result.push('SELECT');
        
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i].trim();
            if (this.config.commaPosition === 'before') {
                if (i === 0) {
                    result.push('    ' + column);
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

    private formatComplexColumn(column: string): string {
        // Handle CASE statements
        if (column.toUpperCase().includes('CASE ')) {
            return this.formatCaseStatement(column);
        }
        
        // Handle window functions (functions with OVER clause)
        if (column.toUpperCase().includes(' OVER ')) {
            return this.formatWindowFunction(column);
        }
        
        // Return column as-is for simple expressions
        return column;
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
        // Simple regex-based approach for window function formatting
        let formatted = windowColumn;
        
        // Find OVER clause and format it
        const overMatch = formatted.match(/(.+?)\s+OVER\s*\((.+?)\)(.*)$/i);
        if (!overMatch) return windowColumn;
        
        const [, beforeOver, overContent, afterOver] = overMatch;
        
        // Format the OVER clause content
        let formattedOverContent = overContent.trim();
        
        // Add line breaks for PARTITION BY and ORDER BY
        formattedOverContent = formattedOverContent.replace(/\s*PARTITION\s+BY\s+/gi, '\n        PARTITION BY ');
        formattedOverContent = formattedOverContent.replace(/\s*ORDER\s+BY\s+/gi, '\n        ORDER BY ');
        formattedOverContent = formattedOverContent.replace(/\s*ROWS\s+BETWEEN\s+/gi, '\n        ROWS BETWEEN ');
        
        // Clean up extra whitespace
        formattedOverContent = formattedOverContent.replace(/^\s+/, '');
        
        return beforeOver + ' OVER (\n        ' + formattedOverContent + '\n    )' + afterOver;
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
                result.push('    ' + column);
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
        // Enhanced WHERE/AND formatting for better readability
        let result = sql;
        
        // Handle WHERE clause with AND/OR on new lines
        result = result.replace(/\bWHERE\s+/gi, 'WHERE ');
        result = result.replace(/\s+AND\s+/gi, '\n    AND ');
        result = result.replace(/\s+OR\s+/gi, '\n    OR ');
        
        return result;
    }
}