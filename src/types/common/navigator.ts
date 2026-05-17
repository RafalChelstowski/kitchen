export interface XRSystem {
  isSessionSupported: (sessionType: 'immersive-vr') => Promise<boolean>;
}

export type NavigatorWithXR = Navigator & {
  xr: XRSystem;
};
