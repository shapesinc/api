import { render } from 'ink';
import { App } from './App.js';

export function startUI(baseUrl: string): void {
  // Disable default Ink exit on Ctrl+C since we handle it in CommandInput
  render(<App baseUrl={baseUrl} />, { exitOnCtrlC: false });
}