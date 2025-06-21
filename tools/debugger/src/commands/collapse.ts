import { config } from '../config.js';
import { saveCollapsePatterns } from '../config/persistence.js';
import chalk from 'chalk';

/**
 * Handle /collapse command and its subcommands.
 */
export async function handleCollapseCommand(args: string[]): Promise<string> {
  const currentPatterns = config.get().responses.collapsedPatterns;

  // No subcommand - show current patterns
  if (args.length === 0) {
    if (currentPatterns.length === 0) {
      return `📋 No collapsed response patterns configured.

${chalk.gray('Use:')} ${chalk.green('/collapse add <pattern>')} ${chalk.gray('to add patterns')}
${chalk.gray('Use:')} ${chalk.green('/collapse clear')} ${chalk.gray('to clear all patterns')}`;
    }

    const patterns = currentPatterns.map((pattern, index) => 
      `${chalk.gray(`${index + 1}.`)} ${chalk.yellow(pattern)}`
    ).join('\n');

    return `📋 Current collapsed response patterns:

${patterns}

${chalk.gray('Use:')} ${chalk.green('/collapse add <pattern>')} ${chalk.gray('to add patterns')}
${chalk.gray('Use:')} ${chalk.green('/collapse remove <pattern>')} ${chalk.gray('to remove patterns')}
${chalk.gray('Use:')} ${chalk.green('/collapse clear')} ${chalk.gray('to clear all patterns')}`;
  }

  const subcommand = args[0].toLowerCase();

  switch (subcommand) {
    case 'clear': {
      config.updateCollapsePatterns([]);
      await saveCollapsePatterns([]);
      return `✅ ${chalk.green('Cleared all collapsed response patterns.')}`;
    }

    case 'add': {
      if (args.length < 2) {
        return `❌ ${chalk.red('Missing pattern.')} Usage: ${chalk.green('/collapse add <pattern>')}`;
      }

      const pattern = args.slice(1).join(' ');
      if (currentPatterns.includes(pattern)) {
        return `⚠️  ${chalk.yellow('Pattern already exists:')} ${chalk.yellow(pattern)}`;
      }

      const newPatterns = [...currentPatterns, pattern];
      config.updateCollapsePatterns(newPatterns);
      await saveCollapsePatterns(newPatterns);
      return `✅ ${chalk.green('Added collapse pattern:')} ${chalk.yellow(pattern)}`;
    }

    case 'remove': {
      if (args.length < 2) {
        return `❌ ${chalk.red('Missing pattern.')} Usage: ${chalk.green('/collapse remove <pattern>')}`;
      }

      const pattern = args.slice(1).join(' ');
      const index = currentPatterns.indexOf(pattern);
      if (index === -1) {
        return `❌ ${chalk.red('Pattern not found:')} ${chalk.yellow(pattern)}`;
      }

      const newPatterns = currentPatterns.filter(p => p !== pattern);
      config.updateCollapsePatterns(newPatterns);
      await saveCollapsePatterns(newPatterns);
      return `✅ ${chalk.green('Removed collapse pattern:')} ${chalk.yellow(pattern)}`;
    }

    default: {
      return `❌ ${chalk.red('Unknown subcommand:')} ${chalk.yellow(subcommand)}

${chalk.gray('Available subcommands:')}
↳ ${chalk.green('/collapse')} - Show current patterns
↳ ${chalk.green('/collapse add <pattern>')} - Add pattern 
↳ ${chalk.green('/collapse remove <pattern>')} - Remove pattern
↳ ${chalk.green('/collapse clear')} - Clear all patterns

${chalk.gray('Pattern examples:')}
↳ ${chalk.yellow('/v1/models')} - Exact match
↳ ${chalk.yellow('/v1/users/*')} - Prefix match (matches /v1/users/me, etc.)`;
    }
  }
}