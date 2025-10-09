# Change Log

All notable changes to the "T-SQLinator" extension will be documented in this file.

## [0.8.2] - 2025-10-09

### 🧹 Project Organization & Cleanup
- **Test Organization**: Moved all test and debug scripts to `/test` subfolder for better project structure
- **Clean Root Directory**: Root directory now contains only essential project files
- **Updated Test References**: All test scripts updated to work from new `/test` directory location
- **Build Optimization**: Cleaned up old VSIX packages and improved build process

### 📁 Files Reorganized
- Moved all `debug-*.js` files to `/test` folder
- Moved all `test-*.js` files to `/test` folder  
- Moved SQL test files (`Comments_test.sql`, `BigQuery.sql`, `Cursor_example.sql`, etc.) to `/test` folder
- Updated all import paths in test files to reference `../out/tSqlinatorFormatter`

### ✅ Verified Functionality
- All 27 main test suite tests still pass (100% success rate)
- All 5 comment handling tests still pass (100% success rate)
- Performance maintained at optimal levels (2.5ms average)
- Complete functionality preserved after reorganization

## [0.8.1] - 2025-10-08

### 🎯 Advanced Comment Handling Implementation
- **Inline Comment Preservation**: Comments with `--` or `/* */` inside SELECT statements now stay on the same line with their code
- **Standalone Comment Spacing**: Standalone comments maintain their current formatting with proper spacing
- **Smart Column Parsing**: Enhanced `parseSelectColumns` method to intelligently detect and preserve inline comments
- **Multi-Column Support**: Correctly handles multiple columns with inline comments in SELECT statements

### Danish User Requirement Fulfilled
> "hvis kommentarer med -- eller /**/ ir inde i et select statement så skal der ikke laves linjeskift før og efter, men hvis den står selvstændigt så bebehold nuværende formattering"

- ✅ Inline comments stay with their code without line breaks
- ✅ Standalone comments preserve their formatting  
- ✅ Both `--` and `/* */` comment styles supported
- ✅ Comprehensive test coverage with `Comments_test.sql`

### Technical Improvements
- Enhanced comment detection logic in column parsing
- Improved comma handling for columns with inline comments
- Smart lookahead parsing to preserve comment-code relationships
- Comprehensive test suite with 5 dedicated comment tests (100% pass rate)

### Fixed
- **Critical Cursor Bug**: Fixed severe cursor statement corruption where OPEN and FETCH statements were being lost and table names were being replaced incorrectly
- **Cursor Preservation**: Enhanced cursor statement detection and parsing to preserve all cursor operations (DECLARE, OPEN, FETCH, CLOSE, DEALLOCATE)
- **Statement Parsing**: Improved statement end detection for cursor workflows to prevent incorrect merging of cursor operations
- **Table Name Protection**: Fixed issue where table names like #Organization were being corrupted in cursor contexts

### Added
- Comprehensive cursor keywords support (CURSOR, OPEN, FETCH, NEXT, CLOSE, DEALLOCATE)
- Enhanced cursor test coverage to prevent future regressions

### Technical Changes
- Reordered cursor detection to occur before general DECLARE block detection
- Enhanced isStatementEnd logic for cursor statement workflows
- Improved formatCursorStatement method with better error handling

## [0.8.0] - 2025-10-08

### 🌊 NEW: River Formatting - Professional SQL Layout! ✨
- **River Formatting**: Revolutionary new formatting style with keywords aligned to 7th column creating a visual "river"
- **Multiple Formatting Modes**: Choose between River, Indent, or Legacy formatting styles
- **JOIN Preservation Fix**: Critical bug fix - INNER JOIN, LEFT OUTER JOIN, etc. are now correctly preserved (no more syntax errors!)
- **BigQuery.sql Compatibility**: Fixed major formatting issues with complex SQL scripts

### 🧪 Comprehensive Testing Suite
- **test-critical.js**: Critical test suite ensuring no syntax errors are introduced
- **sql_formatter_test_script.sql**: Comprehensive test script with all SQL patterns
- **BigQuery.sql**: Real-world complex SQL regression testing
- **100% Test Coverage**: All critical SQL patterns verified across all formatting modes

### 🔧 New Configuration Options
- **useRiverFormatting**: Enable River formatting with 7th column alignment
- **riverColumn**: Customize River alignment column (default: 7)
- **useIndentFormatting**: Enable clean 4-space indent formatting
- **Enhanced Configuration**: More precise control over formatting behavior

### 🐛 Critical Bug Fixes
- **INNER JOIN Preservation**: Fixed bug where "INNER" was being removed from "INNER JOIN" statements
- **LEFT OUTER JOIN**: Fixed similar issue with OUTER being removed from JOIN statements  
- **Syntax Error Prevention**: Comprehensive validation ensures no SQL syntax is broken during formatting
- **Performance Improvements**: Faster formatting with better error handling

### 📝 Documentation & Testing
- **Updated README.md**: Comprehensive documentation with formatting examples
- **Enhanced CHANGELOG**: Detailed release notes with examples
- **Test Suite Integration**: Automated testing prevents regression issues
- **Professional Documentation**: Clear configuration and usage guidelines

## [0.7.1] - 2025-09-26

### MAJOR FIX: SQL Parsing & ORDER BY Alignment ✅
- **CRITICAL FIX**: Fixed window function parsing bug that was corrupting ORDER BY clauses
- **ORDER BY Formatting**: ORDER BY sections now show correct columns with proper comma-first alignment
- **Robust Parsing**: Improved SQL component parsing with accurate parentheses tracking
- **Window Function Support**: Window functions no longer break SQL structure or duplicate content

### Code Improvements
- **Enhanced parseSelectComponents**: Character-by-character parsing with accurate parentheses depth tracking
- **Improved formatWindowFunction**: Balanced parentheses counting prevents over-matching
- **Clean Codebase**: Removed debug files and test artifacts

## [0.7.0] - 2025-09-26

### NEW: Advanced Comment Handling
- **Intelligent Inline Comments**: Comments on the same line as code now stay on the line with proper tab spacing
- **Standalone Comment Spacing**: Comments on their own lines get 2 blank lines above and below
- **SELECT Column Comments**: Inline comments after commas in SELECT lists are correctly attached to the preceding column
- **WHERE Clause Comments**: Inline comments in WHERE conditions are preserved with proper formatting
- **Multi-line Comment Support**: Block comments (/* */) and line comments (--) are handled intelligently

### Comment Formatting Rules
- **Inline comments** (after code): Stay on same line with tab spacing
- **Standalone comments**: Get 2 blank lines above and below for visual separation  
- **Comments inside statements**: Preserved in their original location

### Fixed
- **Window Function Scope Issue**: Fixed issue where window function formatting affected regular SQL clauses
  - Window function formatting now only applies to SELECT column expressions with `OVER (` 
  - Regular GROUP BY, ORDER BY, and HAVING clauses are no longer affected
  - Made regex patterns more specific to avoid false matches
  - `formatOverClauseContent` now uses more precise pattern matching

### Important
Window function formatting is now correctly isolated to only SELECT column expressions containing `OVER (...)` clauses.

## [0.6.9] - 2025-09-26

### Enhanced
- **Advanced Window Function Formatting**: Complete redesign of window function formatting
  - Parentheses are now properly aligned: `OVER (` and closing `)` at same column position
  - `PARTITION BY`, `ORDER BY`, and `ROWS BETWEEN` clauses are perfectly aligned inside
  - Added `formatOverClauseContent` method for sophisticated multi-clause handling
  - Window functions now match professional SQL formatting standards

### Example
```sql
, SUM(e.Salary) OVER (
                        PARTITION BY e.DepartmentID
                        ORDER BY e.HireDate
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                     ) AS RunningTotalSalary
```

## [0.6.8] - 2025-09-26

### Fixed
- **Critical Bug Fix**: Fixed multi-line SELECT parsing that was causing content loss
  - Updated regex patterns to use `[\s\S]*?` instead of `.*?` to properly match across newlines
  - Fixed issue where SELECT columns were being dropped during formatting
  - Multi-line SELECT statements now preserve all content correctly

## [0.6.7] - 2025-09-26

### Fixed
- **SELECT Statement Detection**: Fixed issue where multi-line SELECT statements were not properly detected
  - Updated `determineBlockType` to handle "SELECT" without trailing space
  - Improved `formatSimpleSelect` to preserve existing line breaks when formatting
  - Multi-line SELECT statements now properly convert comma positions

## [0.6.6] - 2025-09-26

### Fixed
- **Comma Position Conversion**: Fixed issue where trailing commas in SELECT statements were not properly converted
  - Existing commas after column names are now properly removed when `commaPosition` is set to `before`
  - Ensures consistent comma positioning regardless of input format
  - Updated `formatComplexColumn` method to clean trailing commas

## [0.6.5] - 2025-09-25

### Changed
- **Rebranding**: Removed all Redgate references and updated to T-SQLinator branding
  - Renamed `RedgateSqlFormatter` to `TSqlinatorFormatter`
  - Updated file name from `redgateSqlFormatter.ts` to `tSqlinatorFormatter.ts`
  - Updated all documentation and comments to reference T-SQLinator instead of Redgate
  - Changed package keywords to reflect T-SQLinator branding
- **Professional Formatting Style**: Updated descriptions to emphasize T-SQLinator's own professional formatting style

### Fixed
- Improved comma alignment in SELECT and GROUP BY clauses
- First column now properly aligned with comma indentation level

## [0.6.4] - 2025-09-25

### Added
- **Advanced JOIN Formatting**: ON and AND clauses in JOIN statements are now properly formatted on separate lines with correct indentation
  - JOIN clauses indented one level under FROM
  - ON clauses indented two levels under JOIN (8 spaces)
  - AND clauses indented at the same level as ON clauses
- **Enhanced SELECT Comma Positioning**: Improved comma placement in SELECT statements
  - Commas now appear at the beginning of lines (before column names)
  - Proper indentation maintained for multi-line SELECT statements
  - Better handling of nested SELECT blocks

### Enhanced
- **JOIN Clause Processing**: Complete rewrite of JOIN formatting logic
  - Supports all JOIN types: INNER, LEFT, RIGHT, FULL, CROSS JOIN
  - Handles multiple AND conditions in JOIN clauses
  - Proper separation of JOIN, ON, and AND keywords
- **Indentation Logic**: Improved indentation handling for complex SQL structures
- **Comma Formatting**: More intelligent comma positioning that respects SQL block context

### Example Output
```sql
FROM table_a a
    INNER JOIN table_b b
        ON a.id = b.a_id
        AND a.status = 'active'
    LEFT JOIN table_c c
        ON b.id = c.b_id
        AND c.deleted = 0

SELECT
    a.id
    , a.name
    , b.description
    , c.value
```

## [0.2.2] - 2025-09-23

### Fixed
- **Extension Icon**: Optimized icon to proper 128x128 pixels and reduced file size from 1.4MB to 22KB
- Icon now displays correctly in VS Code extension list (not just on extension page)
- Improved extension marketplace presentation

## [0.2.1] - 2025-09-23

### Fixed
- **DROP IF EXISTS Formatting**: Enhanced single-line pattern detection for complex object names
- Improved handling of temp tables (#table_name), bracketed names, and schema-qualified objects
- Fixed issue where DROP statements were incorrectly split across multiple lines
- Added automatic semicolon and newline formatting for DROP IF EXISTS statementsnge Log

All notable changes to the "T-SQLinator" extension will be documented in this file.

## [0.2.1] - 2025-09-23

### Fixed
- **DROP IF EXISTS Formatting**: Fixed issue where `DROP TABLE IF EXISTS` statements were being split across multiple lines
- Enhanced single-line pattern detection to support temp tables (#) and complex object names ([brackets], schema.object)
- Added automatic semicolon and newline after DROP IF EXISTS statements for proper formatting

### Enhanced
- Improved regex patterns to handle:
  - Temp tables: `DROP TABLE IF EXISTS #temp_table`
  - Bracketed names: `DROP TABLE IF EXISTS [dbo].[table_name]`
  - Schema qualified names: `DROP TABLE IF EXISTS schema.table_name`
  - Variables: `DROP TABLE IF EXISTS @variable_table`

## [0.2.0] - 2025-09-23

### Added
- **Settings Page**: Full configuration support through VS Code settings
- **Keyboard Shortcuts**: Default keybindings (`Ctrl+Shift+F` and `Alt+Shift+F`) for SQL files
- **Extension Icon**: Added T-SQLinator branded icon
- **Customizable Formatting**: All formatting options are now configurable
  - Keyword case (upper/lower/preserve)
  - Function case (upper/lower/preserve)
  - Data type case (upper/lower/preserve)
  - Indent size (1-8 spaces)
  - Comma position (before/after)
  - Comma and alias alignment options
  - Newline preferences
  - Lines between queries

### Enhanced
- Dynamic configuration loading from VS Code settings
- Improved user experience with customizable preferences
- Better documentation with configuration examples

## [0.1.0] - 2025-09-23

### Added
- Initial release of T-SQLinator
- Custom SQL formatter with professional T-SQLinator formatting style
- Support for uppercase keywords, functions, and data types
- Comma-before positioning for better readability
- Proper indentation and line breaks
- Special handling for single-line patterns like `DROP TABLE IF EXISTS`
- Context menu integration for SQL files
- Command palette support with "Format SQL Document" command
- MIT License
- Comprehensive documentation

### Features
- Automatic detection and formatting of SQL files (.sql extension)
- VS Code DocumentFormattingEditProvider integration
- Custom TSqlinatorFormatter engine
- Support for complex SQL statements including:
  - SELECT queries with JOINs
  - INSERT, UPDATE, DELETE statements
  - CREATE/DROP statements for tables, views, procedures
  - CASE statements
  - Subqueries and CTEs

### Technical Details
- Built with TypeScript
- VS Code API 1.74.0+ compatibility
- No external dependencies for core functionality
- Lightweight and fast formatting engine