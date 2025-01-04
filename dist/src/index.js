"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processFiles = processFiles;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const parser = __importStar(require("@babel/parser"));
const traverse_1 = __importDefault(require("@babel/traverse"));
const generator_1 = __importDefault(require("@babel/generator"));
// Constants
const currentDir = process.cwd();
const validExtensions = ['.js', '.jsx', '.ts', '.tsx'];
async function processFiles() {
    const jsFiles = await getAllJsFiles(currentDir);
    console.log(`Found ${jsFiles.length} JavaScript/TypeScript files`);
    for (const file of jsFiles) {
        try {
            const content = await fs_1.promises.readFile(file, 'utf-8');
            const processedContent = removeConsoleLogs(content);
            if (content !== processedContent) {
                await fs_1.promises.writeFile(file, processedContent, 'utf-8');
                console.log(`Processed: ${path_1.default.relative(currentDir, file)}`);
            }
        }
        catch (error) {
            console.error(`Error processing ${file}:`, error instanceof Error ? error.message : String(error));
        }
    }
}
async function getAllJsFiles(dir) {
    const jsFiles = [];
    async function traverseDir(currentPath) {
        const items = await fs_1.promises.readdir(currentPath);
        for (const item of items) {
            const fullPath = path_1.default.join(currentPath, item);
            const stats = await fs_1.promises.stat(fullPath);
            if (stats.isDirectory()) {
                if (!fullPath.includes('node_modules') && !fullPath.includes('.git')) {
                    await traverseDir(fullPath);
                }
            }
            else if (stats.isFile()) {
                const ext = path_1.default.extname(item);
                if (validExtensions.includes(ext)) {
                    jsFiles.push(fullPath);
                }
            }
        }
    }
    await traverseDir(dir);
    return jsFiles;
}
function removeConsoleLogs(code) {
    try {
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript'],
        });
        (0, traverse_1.default)(ast, {
            CallExpression(path) {
                var _a;
                if (isConsoleCall(path.node) && isStandaloneExpression(path)) {
                    (_a = path.parentPath) === null || _a === void 0 ? void 0 : _a.remove();
                }
            }
        });
        const output = (0, generator_1.default)(ast, { retainLines: true }, code);
        return output.code;
    }
    catch (error) {
        console.error('Error parsing file:', error instanceof Error ? error.message : String(error));
        return code;
    }
}
function isConsoleCall(node) {
    if (!('callee' in node))
        return false;
    const callee = node.callee;
    return (callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'console' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'log');
}
function isStandaloneExpression(path) {
    var _a, _b;
    return (path.parent.type === 'ExpressionStatement' &&
        (((_a = path.parentPath) === null || _a === void 0 ? void 0 : _a.parent.type) === 'Program' ||
            ((_b = path.parentPath) === null || _b === void 0 ? void 0 : _b.parent.type) === 'BlockStatement'));
}
// Run the processor with proper error handling
processFiles().catch((error) => {
    console.error('Fatal error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
});
//# sourceMappingURL=index.js.map