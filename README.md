# T-SQLinator v0.8.0

A Visual Studio Code extension that formats SQL documents with advanced formatting options.
The T-SQLinator terminates messy SQL code and transforms it into beautifully formatted queries!

🎉 **NEW in v0.8.0**: River Formatting - Professional SQL formatting with keyword alignment to create a visual "river" effect!

## Features

- **🌊 River Formatting**: New professional formatting style with keywords aligned to 7th column creating a visual "river"
- **📐 Indent Formatting**: Clean 4-space indentation alternative to River formatting  
- **⚡ Legacy Formatting**: Original T-SQLinator professional style preserved
- **🔧 Automatic SQL Formatting**: Format SQL documents with a single command or automatically when saving
- **🎯 Context Menu Integration**: Right-click in SQL files to access formatting options
- **⌨️ Command Palette Support**: Use `Format SQL Document` command from the command palette
- **🚀 Keyboard Shortcuts**: Default keybindings for quick formatting (`Ctrl+Shift+F` or `Alt+Shift+F`)
- **⚙️ Customizable Settings**: Configure formatting preferences through VS Code settings
- **📝 JOIN Preservation**: Correctly preserves INNER JOIN, LEFT OUTER JOIN, etc. without syntax errors
- **🧪 Extensively Tested**: Comprehensive test suite ensures reliable formatting

## Configuration

T-SQLinator can be customized through VS Code settings. Go to `File > Preferences > Settings` and search for "T-SQLinator" to configure:

### Available Settings

- **t-sqlinator.useRiverFormatting** (`boolean`) - Default: `false`
  - Enable River formatting with keywords aligned to 7th column

- **t-sqlinator.riverColumn** (`1-20`) - Default: `7`  
  - Column position for River formatting alignment

- **t-sqlinator.useIndentFormatting** (`boolean`) - Default: `false`
  - Enable Indent formatting with 4-space indentation

- **t-sqlinator.keywordCase** (`upper` | `lower` | `preserve`) - Default: `upper`
  - Case formatting for SQL keywords (SELECT, FROM, WHERE, etc.)

- **t-sqlinator.functionCase** (`upper` | `lower` | `preserve`) - Default: `upper`
  - Case formatting for SQL functions (COUNT, SUM, MAX, etc.)

- **t-sqlinator.dataTypeCase** (`upper` | `lower` | `preserve`) - Default: `upper`
  - Case formatting for SQL data types (VARCHAR, INT, DATE, etc.)

- **t-sqlinator.indentSize** (`1-8`) - Default: `4`
  - Number of spaces to use for indentation

- **t-sqlinator.commaPosition** (`before` | `after`) - Default: `before`
  - Position of commas in SELECT statements

- **t-sqlinator.alignCommas** (`boolean`) - Default: `true`
  - Align commas in SELECT statements

- **t-sqlinator.alignAliases** (`boolean`) - Default: `true`
  - Align column aliases in SELECT statements

- **t-sqlinator.newlineAfterSelect** (`boolean`) - Default: `true`
  - Add newline after SELECT keyword

- **t-sqlinator.linesBetweenQueries** (`0-5`) - Default: `2`
  - Number of blank lines between separate SQL queries

## Formatting Styles

### 🌊 River Formatting (NEW!)
Creates a visual "river" by aligning keywords to the 7th column:
```sql
SELECT col1
     , col2
     , col3
      FROM table1
      INNER JOIN table2
    ON table1.id = table2.id  
      WHERE col1 > 100
      ORDER BY col1
```

### 📐 Indent Formatting
Clean 4-space indentation style:
```sql
SELECT
    col1
    ,col2
    ,col3
FROM
    table1
    INNER JOIN table2
        ON table1.id = table2.id
WHERE
    col1 > 100
ORDER BY
    col1
```

### ⚡ Legacy Formatting
Original T-SQLinator professional style:
```sql
SELECT
      col1
    , col2
    , col3
FROM table1
    INNER JOIN table2
        ON table1.id = table2.id
WHERE col1 > 100
ORDER BY col1
```

## Usage

### Format Document
1. Open a SQL file (`.sql` extension)
2. Use one of these methods:
   - **Keyboard shortcuts**: `Ctrl+Shift+F` or `Alt+Shift+F` (when in SQL file)
   - **Command Palette**: Press `Ctrl+Shift+P` and type "Format SQL Document"
   - **Context Menu**: Right-click in the editor and select "Format SQL Document"
   - **VS Code Format**: Use `Shift+Alt+F` (VS Code's built-in format document)

### Keyboard Shortcuts

- `Ctrl+Shift+F` - Format SQL Document (when in SQL file)
- `Alt+Shift+F` - Format SQL Document (when in SQL file)

*Note: These shortcuts only work when you have a SQL file open and focused.*

## Installation

### From VSIX Package
1. Download the `t-sqlinator-x.x.x.vsix` file
2. In VS Code, press `Ctrl+Shift+P` and type "Extensions: Install from VSIX"
3. Select the downloaded VSIX file

### From Source
1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to build the extension
4. Press `F5` to launch a new VS Code window with the extension loaded

## Testing

T-SQLinator v0.8.0 includes comprehensive testing with real-world SQL scripts:

- **sql_formatter_test_script.sql**: Comprehensive test script with various SQL patterns
- **BigQuery.sql**: Real-world complex SQL script for regression testing
- **test-suite.js**: Automated test suite ensuring formatting reliability
- **test-critical.js**: Critical tests for syntax preservation

Run tests:
```bash
node test-critical.js    # Critical syntax preservation tests
node test-suite.js       # Full comprehensive test suite
```

## Requirements

- Visual Studio Code 1.74.0 or higher
- Node.js (for development)

## Development

### Building
```bash
npm run compile
```

### Watching for Changes
```bash
npm run watch
```

### Packaging
```bash
vsce package
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with the VS Code Extension API
- Custom T-SQLinator formatting engine designed specifically for T-SQL and SQL Server compatibility