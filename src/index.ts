import { promises as fs } from 'fs';
import path from 'path';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { Node, CallExpression, MemberExpression } from '@babel/types';
import type { NodePath } from '@babel/traverse';

// Constants
const currentDir: string = process.cwd();
const validExtensions: string[] = ['.js', '.jsx', '.ts', '.tsx'];

// Define types for our AST nodes and paths
type CallExpressionPath = NodePath<CallExpression>;

export async function processFiles(): Promise<void> {
    const jsFiles: string[] = await getAllJsFiles(currentDir);
    console.log(`Found ${jsFiles.length} JavaScript/TypeScript files`);
    
    for (const file of jsFiles) {
        try {
            const content: string = await fs.readFile(file, 'utf-8');
            const processedContent: string = removeConsoleLogs(content);
            
            if (content !== processedContent) {
                await fs.writeFile(file, processedContent, 'utf-8');
                console.log(`Processed: ${path.relative(currentDir, file)}`);
            }
        } catch (error) {
            console.error(`Error processing ${file}:`, error instanceof Error ? error.message : String(error));
        }
    }
}

async function getAllJsFiles(dir: string): Promise<string[]> {
    const jsFiles: string[] = [];

    async function traverseDir(currentPath: string): Promise<void> {
        const items: string[] = await fs.readdir(currentPath);

        for (const item of items) {
            const fullPath: string = path.join(currentPath, item);
            const stats = await fs.stat(fullPath);

            if (stats.isDirectory()) {
                if (!fullPath.includes('node_modules') && !fullPath.includes('.git')) {
                    await traverseDir(fullPath);
                }
            } else if (stats.isFile()) {
                const ext: string = path.extname(item);
                if (validExtensions.includes(ext)) {
                    jsFiles.push(fullPath);
                }
            }
        }
    }

    await traverseDir(dir);
    return jsFiles;
}

function removeConsoleLogs(code: string): string {
    try {
        const ast = parser.parse(code, {
            sourceType: 'module',
            plugins: ['jsx', 'typescript'],
        });

        traverse(ast, {
            CallExpression(path: CallExpressionPath) {
                if (isConsoleCall(path.node) && isStandaloneExpression(path)) {
                    path.parentPath?.remove();
                }
            }
        });

        const output = generate(ast, { retainLines: true }, code);
        return output.code;
    } catch (error) {
        console.error('Error parsing file:', error instanceof Error ? error.message : String(error));
        return code;
    }
}

function isConsoleCall(node: Node): node is CallExpression {
    if (!('callee' in node)) return false;
    
    const callee = node.callee as MemberExpression;
    return (
        callee.type === 'MemberExpression' &&
        callee.object.type === 'Identifier' &&
        callee.object.name === 'console' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === 'log'
    );
}

function isStandaloneExpression(path: CallExpressionPath): boolean {
    return (
        path.parent.type === 'ExpressionStatement' &&
        (
            path.parentPath?.parent.type === 'Program' ||
            path.parentPath?.parent.type === 'BlockStatement'
        )
    );
}

// Run the processor with proper error handling
processFiles().catch((error: unknown) => {
    console.error('Fatal error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
});