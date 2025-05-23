import { Command } from 'commander';
import inquirer from 'inquirer';
import open from 'open';
import chalk from 'chalk';
import { saveToken, getAuthUrl, authenticate, clearToken, getToken } from '../utils/auth.js';

const login = new Command('login')
  .description('Authenticate with Shapes API')
  .action(async () => {
    try {
      console.log(chalk.blue('Starting authentication process...'));

      const authUrl = await getAuthUrl();
      console.log(chalk.yellow('Opening browser for authentication...'));
      console.log(chalk.cyan(`Auth URL: ${authUrl}`));
      
      await open(authUrl);

      const { code } = await inquirer.prompt([
        {
          type: 'input',
          name: 'code',
          message: 'Please enter the authorization code from the browser:',
        },
      ]);

      const token = await authenticate(code);
      await saveToken(token);

      console.log(chalk.green('Successfully authenticated!'));
    } catch (error) {
      console.error(chalk.red('Authentication failed:'), (error as Error).message);
      process.exit(1);
    }
  });

const logout = new Command('logout')
  .description('Clear authentication token')
  .action(async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.log(chalk.yellow('Not currently authenticated.'));
        return;
      }

      await clearToken();
      console.log(chalk.green('Successfully logged out!'));
    } catch (error) {
      console.error(chalk.red('Logout failed:'), (error as Error).message);
      process.exit(1);
    }
  });

export { login, logout };