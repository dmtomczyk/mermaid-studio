import { BuilderAppContext } from './types';

export function persistState(context: BuilderAppContext): void {
  context.vscode.setState(context.state);
}
