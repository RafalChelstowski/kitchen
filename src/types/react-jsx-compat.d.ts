import type { JSX as ReactJSX } from 'react';

declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration merging keeps React Three Fiber JSX elements available globally
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}

export {};
