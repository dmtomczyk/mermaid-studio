import * as fs from 'fs';
import * as path from 'path';

export interface CanvasWebviewDiagnosticsResult {
  script: string;
  syntaxOk: boolean;
  syntaxError?: string;
  htmlPath?: string;
  scriptPath?: string;
}

export function runCanvasWebviewDiagnostics(
  html: string,
  options: { debugEnabled: boolean; outputDir: string }
): CanvasWebviewDiagnosticsResult {
  const script = extractInlineScriptFromHtml(html);
  const syntax = validateJavaScriptSyntax(script);

  let htmlPath: string | undefined;
  let scriptPath: string | undefined;
  if (options.debugEnabled) {
    fs.mkdirSync(options.outputDir, { recursive: true });
    htmlPath = path.join(options.outputDir, 'last-diagram-canvas.html');
    scriptPath = path.join(options.outputDir, 'last-diagram-canvas-script.js');
    fs.writeFileSync(htmlPath, html, 'utf8');
    fs.writeFileSync(scriptPath, script, 'utf8');
  }

  return {
    script,
    syntaxOk: syntax.ok,
    syntaxError: syntax.error,
    htmlPath,
    scriptPath
  };
}

export function extractInlineScriptFromHtml(html: string): string {
  const match = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  return match?.[1] ?? '';
}

export function validateJavaScriptSyntax(script: string): { ok: boolean; error?: string } {
  try {
    // Wrap as a function body to validate syntax without executing it.
    // eslint-disable-next-line no-new-func
    new Function(script);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.stack || error.message : String(error)
    };
  }
}
