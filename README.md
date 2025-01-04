# console-log-remover

A CLI tool to automatically remove console.log statements from your JavaScript/TypeScript codebase before deployment.

## Features
- Removes standalone console.log statements
- Supports JavaScript, TypeScript, JSX, and TSX files
- Preserves code formatting
- Skips console.logs that are part of expressions or assignments
- Ignores node_modules and .git directories
- Maintains source maps

## Installation

### npm
```bash
npm install -D console-log-remover
```

### pnpm
```bash
pnpm add -D console-log-remover
```

### yarn
```bash
yarn add -D console-log-remover
``` 

### Usage
#### CLI
Run in your project directory:
```bash
remove-logs
```

### Package Scripts
Add to your package.json scripts:

```json
{
  "scripts": {
    "prebuild": "remove-logs",
    "build": "your-build-command"
  }
}
```

### Monorepo Setup
#### PNPM Workspaces
In your package.json:

```json
{
  "dependencies": {
    "console-log-remover": "workspace:*"
  }
}
```

### What gets removed?
✅ Will remove:
```javascript
console.log("debug info");
console.log(variable);
console.log("error", error);

if (condition) {
    console.log("inside block");
}
```


### ❌ Won't remove (to preserve code functionality):
```javascript
const result = console.log("returning something");
return console.log("value") || defaultValue;
condition && console.log("test");
```

### Limitations

* Only removes standalone console.log statements
* Doesn't remove console.warn, console.error, etc.
* Won't remove logs that are part of larger expressions


## License
ISC
## Author
recursive