# Change Log

All notable changes to the "T-SQLinator" extension will be documented in this file.

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