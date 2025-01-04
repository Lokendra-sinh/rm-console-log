#!/usr/bin/env node
import { processFiles } from '../src/index';

processFiles().catch((error: unknown) => {
    console.error('Fatal error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
});