import chalk from 'chalk';
import boxen from 'boxen';

export function renderCodeBlock(code: string, language?: string): string {
  const header = language ? chalk.gray(`\n${language}\n`) : '\n';
  const boxedCode = boxen(code, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'gray',
  });
  return header + boxedCode;
}

export function renderError(message: string): string {
  return chalk.red(`\nError: ${message}\n`);
}

export function renderSuccess(message: string): string {
  return chalk.green(`\nSuccess: ${message}\n`);
}

export function renderInfo(message: string): string {
  return chalk.blue(`\nInfo: ${message}\n`);
}

export function renderWarning(message: string): string {
  return chalk.yellow(`\nWarning: ${message}\n`);
}