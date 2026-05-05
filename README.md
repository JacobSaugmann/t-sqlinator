# T-SQLinator

A Visual Studio Code extension that formats T-SQL and SQL files with professional river-style keyword alignment.

## Features

- **River Formatting**: Keywords align to a fixed column creating a clean vertical "river" — the default and recommended style.
- **Indent Formatting**: Traditional 4-space indentation alternative.
- **Legacy Formatting**: Original comma-before style without river alignment.
- **Automatic Formatting**: Integrates with VS Code's Format Document (`Shift+Alt+F`) and format-on-save.
- **Context Menu**: Right-click in any SQL file to format.
- **Command Palette**: Run "Format SQL Document" from `Ctrl+Shift+P`.
- **Keyboard Shortcuts**: `Ctrl+Shift+F` or `Alt+Shift+F` when a SQL file is focused.
- **JOIN Preservation**: INNER JOIN, LEFT OUTER JOIN, and other join types are preserved correctly.

## Formatting Styles

### River Formatting (default)

Keywords end at column 7, creating a vertical alignment:

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

### Indent Formatting

```sql
SELECT
    col1
    ,col2
    ,col3
FROM table1
    INNER JOIN table2
        ON table1.id = table2.id
WHERE
    col1 > 100
ORDER BY
    col1
```

### Legacy Formatting

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

## Configuration

Open VS Code settings (`Ctrl+,`) and search for **T-SQLinator**.

### Formatting style

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `t-sqlinator.useRiverFormatting` | boolean | `true` | River formatting with keyword alignment |
| `t-sqlinator.riverColumn` | number (1–20) | `7` | Column position for river alignment |
| `t-sqlinator.useIndentFormatting` | boolean | `false` | Indent formatting (overrides river when both are false) |

### Keyword casing

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `t-sqlinator.keywordCase` | `upper` / `lower` / `preserve` | `upper` | SQL keywords (SELECT, FROM, WHERE, …) |
| `t-sqlinator.functionCase` | `upper` / `lower` / `preserve` | `upper` | SQL functions (COUNT, SUM, MAX, …) |
| `t-sqlinator.dataTypeCase` | `upper` / `lower` / `preserve` | `upper` | Data types (VARCHAR, INT, DATE, …) |

### Column layout

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `t-sqlinator.commaPosition` | `before` / `after` | `before` | Comma placement in SELECT lists |
| `t-sqlinator.alignCommas` | boolean | `true` | Align commas in SELECT lists |
| `t-sqlinator.alignAliases` | boolean | `true` | Align column aliases |
| `t-sqlinator.indentSize` | number (1–8) | `4` | Spaces per indent level |

### Clause newlines

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `t-sqlinator.newlineAfterSelect` | boolean | `true` | New line after SELECT keyword |
| `t-sqlinator.newlineBeforeFrom` | boolean | `true` | New line before FROM |
| `t-sqlinator.newlineBeforeWhere` | boolean | `true` | New line before WHERE |
| `t-sqlinator.newlineBeforeGroupBy` | boolean | `true` | New line before GROUP BY |
| `t-sqlinator.newlineBeforeHaving` | boolean | `true` | New line before HAVING |
| `t-sqlinator.newlineBeforeOrderBy` | boolean | `true` | New line before ORDER BY |

### Other

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `t-sqlinator.linesBetweenQueries` | number (0–5) | `2` | Blank lines between statements |

## Installation

### From VSIX

1. Download the `.vsix` file from the repository.
2. In VS Code press `Ctrl+Shift+P` → **Extensions: Install from VSIX**.
3. Select the file.

### From source

```bash
git clone <repo>
npm install
npm run compile
# Press F5 to launch Extension Development Host
```

## Usage

1. Open any `.sql` file.
2. Format with one of:
   - `Shift+Alt+F` — VS Code built-in Format Document
   - `Ctrl+Shift+F` or `Alt+Shift+F` — T-SQLinator shortcut
   - `Ctrl+Shift+P` → **Format SQL Document**
   - Right-click → **Format SQL Document**

## Development

```bash
npm run compile      # one-off build
npm run watch        # watch mode
npx vsce package     # produce .vsix
```

Run the test suite:

```bash
npm run compile
node test/test-suite.js
```

## Requirements

- Visual Studio Code 1.74.0 or higher

## License

MIT
