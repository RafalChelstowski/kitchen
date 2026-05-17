import type { ThreeElement } from '@react-three/fiber';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      pointerLockControls: ThreeElement<typeof PointerLockControls>;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      pointerLockControls: ThreeElement<typeof PointerLockControls>;
    }
  }
}

declare module 'react/jsx-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      pointerLockControls: ThreeElement<typeof PointerLockControls>;
    }
  }
}

declare module 'react/jsx-dev-runtime' {
  namespace JSX {
    interface IntrinsicElements {
      pointerLockControls: ThreeElement<typeof PointerLockControls>;
    }
  }
}
