## 🔧 T-SQLinator VS Code Configuration Guide

### 📍 How to Access T-SQLinator Settings in VS Code:

1. **Open VS Code Settings:**
   - Press `Ctrl + ,` (Windows/Linux) or `Cmd + ,` (Mac)
   - OR go to `File > Preferences > Settings`

2. **Find T-SQLinator Settings:**
   - In the search box, type: `t-sqlinator`
   - OR go to `Extensions` tab in settings and scroll down to `T-SQLinator`

3. **Available Settings:**

#### 🌊 **River Formatting Settings**
- **Use River Formatting** (`t-sqlinator.useRiverFormatting`)
  - Type: Boolean (checkbox)
  - Default: `true`
  - Description: Enable river formatting style with aligned keywords

- **River Column** (`t-sqlinator.riverColumn`) 
  - Type: Number (1-20)
  - Default: `7`
  - Description: Column position for keyword alignment

- **Use Indent Formatting** (`t-sqlinator.useIndentFormatting`)
  - Type: Boolean (checkbox)  
  - Default: `false`
  - Description: Use traditional indentation instead of river

#### 📝 **Case Settings**
- **Keyword Case** (`t-sqlinator.keywordCase`)
- **Function Case** (`t-sqlinator.functionCase`) 
- **Data Type Case** (`t-sqlinator.dataTypeCase`)

#### 🔧 **Formatting Settings**
- **Comma Position** (`t-sqlinator.commaPosition`)
- **Align Commas** (`t-sqlinator.alignCommas`)
- **Align Aliases** (`t-sqlinator.alignAliases`)
- **Indent Size** (`t-sqlinator.indentSize`)

#### 📏 **Newline Settings**
- **Newline After Select** (`t-sqlinator.newlineAfterSelect`)
- **Newline Before From** (`t-sqlinator.newlineBeforeFrom`)
- **Newline Before Where** (`t-sqlinator.newlineBeforeWhere`)
- **Newline Before Group By** (`t-sqlinator.newlineBeforeGroupBy`)
- **Newline Before Order By** (`t-sqlinator.newlineBeforeOrderBy`)

#### 🌐 **General Settings**
- **Lines Between Queries** (`t-sqlinator.linesBetweenQueries`)

### 🚨 Troubleshooting:

If you don't see the settings:

1. **Restart VS Code completely** (File > Exit, then reopen)
2. **Check extension is installed**: `Ctrl+Shift+X` > search "T-SQLinator"
3. **Verify extension is enabled**: Should show "Enabled" status
4. **Try searching for just "river"** in settings search box

### ✅ Test the Extension:

1. Open a `.sql` file
2. Right-click > "Format SQL Document"
3. OR use `Ctrl+Shift+F`
4. Check if formatting works

The extension is installed as version **0.8.4** with all configuration options available!