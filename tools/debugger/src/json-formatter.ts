import chalk from 'chalk';
import { config } from './config.js';

/**
 * Format JSON with OpenAI chat syntax highlighting.
 */
export function formatJson(obj: Record<string, unknown>, { isResponse = false }: { isResponse?: boolean } = {}): string[] {
  const lines: string[] = [];
  const str = JSON.stringify(obj, null, 2);
  
  for (const line of str.split('\n')) {
    const m = line.match(/^(\s*)(.*)$/);
    const indent = m ? m[1] : '';
    const trimmed = m ? m[2] : line;
    
    // braces or brackets
    if (/^[{}[\]],?$/.test(trimmed)) {
      lines.push(indent + chalk.gray(trimmed));
    } else if (trimmed.startsWith('"role"')) {
      const parts = trimmed.match(/^"role":\s*"([^"]+)"(,?)$/);
      if (parts) {
        const [, role, comma] = parts;
        const colorFn = config.ui.roleColors[role] || chalk.white;
        lines.push(indent + chalk.gray('"role": ') + colorFn(`"${role}"`) + (comma || ''));
      } else {
        lines.push(indent + chalk.gray(trimmed));
      }
    } else if (trimmed.startsWith('"model"')) {
      const partsModel = trimmed.match(/^("model":\s*)(".*")(,?)$/);
      if (partsModel) {
        const [, keyPart, valuePart, comma] = partsModel;
        lines.push(indent + chalk.gray(keyPart) + chalk.blue(valuePart) + (comma || ''));
      } else {
        lines.push(indent + chalk.gray(trimmed));
      }
    } else if (trimmed.startsWith('"content"')) {
      const partsContent = trimmed.match(/^("content":\s*)(".*")(,?)$/);
      if (partsContent) {
        const [, keyPart, valuePart, comma] = partsContent;
        lines.push(indent + chalk.gray(keyPart) + chalk.white(valuePart) + (comma || ''));
      } else {
        const keyMatch = trimmed.match(/^("content":\s*)(.*)(,?)$/);
        if (keyMatch) {
          const [, keyPart, valuePart, comma] = keyMatch;
          lines.push(indent + chalk.gray(keyPart) + chalk.white(valuePart) + (comma || ''));
        } else {
          lines.push(indent + chalk.gray(trimmed));
        }
      }
    } else if (trimmed.startsWith('"name"')) {
      const partsName = trimmed.match(/^("name":\s*)(".*")(,?)$/);
      if (partsName) {
        const [, keyPart, valuePart, comma] = partsName;
        lines.push(indent + chalk.gray(keyPart) + chalk.yellow(valuePart) + (comma || ''));
      } else {
        lines.push(indent + chalk.gray(trimmed));
      }
    } else if (trimmed.startsWith('"text"')) {
      const partsText = trimmed.match(/^("text":\s*)(".*")(,?)$/);
      if (partsText) {
        const [, keyPart, valuePart, comma] = partsText;
        lines.push(indent + chalk.gray(keyPart) + chalk.white(valuePart) + (comma || ''));
      } else {
        lines.push(indent + chalk.gray(trimmed));
      }
    } else if (trimmed.startsWith('"image_url"')) {
      const partsImageUrl = trimmed.match(/^("image_url":\s*)(.*)(,?)$/);
      if (partsImageUrl) {
        const [, keyPart, valuePart, comma] = partsImageUrl;
        lines.push(indent + chalk.gray(keyPart) + chalk.cyan(valuePart) + (comma || ''));
      } else {
        lines.push(indent + chalk.gray(trimmed));
      }
    } else if (trimmed.startsWith('"stream"')) {
      const partsStream = trimmed.match(/^("stream":\s*)(true|false)(,?)$/);
      if (partsStream) {
        const [, keyPart, valuePart, comma] = partsStream;
        lines.push(indent + chalk.gray(keyPart) + chalk.yellow(valuePart) + (comma || ''));
      } else {
        lines.push(indent + chalk.gray(trimmed));
      }
    } else if (isResponse && trimmed.startsWith('"finish_reason"')) {
      const parts = trimmed.match(/^"finish_reason":\s*"([^"]+)"(,?)$/);
      if (parts) {
        const [, reason, comma] = parts;
        const colorFn = config.ui.finishReasonColors[reason] || chalk.red;
        lines.push(indent + chalk.gray('"finish_reason": ') + colorFn(`"${reason}"`) + (comma || ''));
      } else {
        lines.push(indent + chalk.gray(trimmed));
      }
    } else {
      lines.push(indent + chalk.gray(trimmed));
    }
  }
  
  return lines;
}