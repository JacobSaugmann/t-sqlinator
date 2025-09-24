# T-SQLinator

A Visual Studio Code extension that formats SQL documents.
The T-SQLinator terminates messy SQL code and transforms it into beautifully formatted queries!
And its created entierly by copilot and prompting

## Features

- **Automatic SQL Formatting**: Format SQL documents with a single command or automatically when saving
- **Redgate SQL Prompt Style**: Mimics the popular formatting style used by Redgate SQL Prompt
- **Context Menu Integration**: Right-click in SQL files to access formatting options
- **Command Palette Support**: Use `Format SQL Document` command from the command palette
- **Keyboard Shortcuts**: Default keybindings for quick formatting (`Ctrl+Shift+F` or `Alt+Shift+F`)
- **Customizable Settings**: Configure formatting preferences through VS Code settings
- **Single-line DROP statements**: Keeps `DROP XXX IF EXISTS` statements on one line for readability

## Configuration

T-SQLinator can be customized through VS Code settings. Go to `File > Preferences > Settings` and search for "T-SQLinator" to configure:

### Available Settings

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

- Inspired by Redgate SQL Prompt formatting style
- Built with the VS Code Extension API
- Custom formatting engine designed specifically for T-SQL and SQL Server compatibility