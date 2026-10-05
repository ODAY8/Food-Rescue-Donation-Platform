import '@testing-library/jest-dom/vitest';
import { act } from 'react';

// React 19 exposes `act` on the ESM `react` module but not always on the CJS
// export. RTL 16.3.2 reads `React.act` from CJS. Bridge them so component
// tests render under React 19.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactCjs = (globalThis as any).__react_cjs;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
if (typeof act === 'function') {
  // Patch the CJS react module that RTL requires.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react') as any;
  if (typeof React.act !== 'function') {
    Object.defineProperty(React, 'act', { value: act, configurable: true, enumerable: true });
  }
}
void ReactCjs;
