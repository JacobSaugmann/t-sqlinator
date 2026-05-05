# T-SQLinator — Claude Code conventions

## Project overview

VS Code extension that formats T-SQL files. The formatter implements a "river" style where SQL keywords align to a fixed column position, producing a visual vertical alignment. Published as a `.vsix` package.

## Project structure

```
src/
  extension.ts              VS Code entry point — registers commands and the
                            DocumentFormattingEditProvider
  tSqlinatorFormatter.ts    All formatting logic lives here
out/                        Compiled JS (generated, do not edit)
test/
  test-suite.js             Main regression test suite (27 tests)
  debug-*.js                Ad-hoc debug scripts
  *.sql                     SQL fixtures for manual and automated tests
package.json                Extension manifest + all VS Code contributions
tsconfig.json               Strict TypeScript, targets ES2020, outputs to out/
```

## Build & development

```bash
npm run compile     # one-off compile
npm run watch       # watch mode during development
```

To package for distribution:
```bash
npx vsce package   # produces t-sqlinator-<version>.vsix
```

Install locally for testing:
```bash
code --install-extension t-sqlinator-<version>.vsix
```

Press `F5` in VS Code to launch the Extension Development Host.

## Architecture

The formatter pipeline in `tSqlinatorFormatter.ts`:

1. `format(sql)` — entry point, calls `parseIntoBlocks()`
2. `parseIntoBlocks()` — splits the SQL string into typed blocks:
   `COMMENT`, `LINE_COMMENT`, `CTE_STATEMENT`, `CURSOR_STATEMENT`,
   `SELECT_STATEMENT`, `INSERT_STATEMENT`, etc.
3. Each block type has a dedicated `format*` method that returns the
   formatted string.
4. Results are joined with `linesBetweenQueries` blank lines.

**River formatting**: keywords (`FROM`, `WHERE`, `JOIN`, etc.) are
padded so they end at `riverColumn` (default 7). The SELECT column list
is indented past that column.

## Configuration

All user-facing settings are declared in `package.json` under
`contributes.configuration`. `extension.ts` reads them via
`vscode.workspace.getConfiguration('t-sqlinator')` and passes a
`TSqlinatorConfig` object to `TSqlinatorFormatter`.

When adding a new setting:
1. Add the property to `TSqlinatorConfig` interface in
   `tSqlinatorFormatter.ts`
2. Add the default in the constructor
3. Add the setting definition to `package.json` contributions
4. Read it in `extension.ts` and include it in `userConfig`

## Code conventions

- TypeScript strict mode — no `any`, no non-null assertion shortcuts
  unless the invariant is provably safe.
- Formatting logic belongs exclusively in `tSqlinatorFormatter.ts`.
  `extension.ts` is wiring only.
- Prefer private methods over nested functions inside class methods.
- Regex patterns that appear more than once must be extracted to a
  `private readonly` field.
- No external runtime dependencies. The `devDependencies` section is
  intentionally small.
- No emojis in code, comments, log messages, or commit messages.
- Use `console.error` only inside the extension host; the formatter
  class must throw rather than log.

## Testing

Run the main test suite (requires a compile first):
```bash
npm run compile
node test/test-suite.js
```

Individual debug scripts in `test/` can be run the same way. They
import from `../out/tSqlinatorFormatter`.

When fixing a bug, add a test case to `test/test-suite.js` that
reproduces the failure before fixing it.

No formal test framework is used — the suite is vanilla Node.js with
`console.assert`.

## Packaging & release

1. Bump `version` in `package.json`
2. Add an entry to `CHANGELOG.md`
3. `npm run compile`
4. `npx vsce package`
5. Commit the new `.vsix`
