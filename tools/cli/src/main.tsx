#!/usr/bin/env node

import { render } from 'ink';
import { App } from './components/App.js';

render(<App />, { exitOnCtrlC: false, patchConsole: false });