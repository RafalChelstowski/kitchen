import * as THREE from 'three';

import { disabledNeonMaterial } from '../../../common/materials/materials';
import { getState, initialState, setState } from '../../../store/store';
import {
  AchievementName,
  AchievementPayloadStatus,
  InteractiveLetters,
} from '../../../types';
import {
  createGltfFixture,
  createUseGltfMock,
  render3D,
  type R3FTestHarness,
} from '../../../test';

const neonNodeNames = [
  'switch_button',
  'switch_container',
  'NurbsPath001',
  'NurbsPath002',
  'NurbsPath003',
  'Cube108',
  'Cube109',
  'Cube110',
  'Cube111',
  'Cube112',
  'Cube113',
  'NurbsPath',
  'NurbsPath004',
  'Cube114',
  'NurbsPath005',
  'NurbsPath006',
  'NurbsPath007',
  'Cube115',
  'NurbsPath008',
] as const;

type NeonNodeName = (typeof neonNodeNames)[number];

const neonMaterialNodeNames = [
  'NurbsPath001',
  'NurbsPath002',
  'NurbsPath003',
] as const;

const enabledMaterials = {
  neonMaterialGreen: new THREE.MeshStandardMaterial({ color: 'green' }),
  neonMaterialPurple: new THREE.MeshStandardMaterial({ color: 'purple' }),
  neonMaterialWhite: new THREE.MeshStandardMaterial({ color: 'white' }),
};

const fixture = createGltfFixture({
  nodes: neonNodeNames.map((name) => ({ name })),
  materials: {
    blackPlasticMaterial: new THREE.MeshStandardMaterial({ color: 'black' }),
    whiteMaterial: new THREE.MeshStandardMaterial({ color: 'white' }),
    ...enabledMaterials,
  },
});
const textures = new Map<string, THREE.Texture>();
const springTargets: number[] = [];

vi.doMock('@react-spring/three', () => ({
  a: { mesh: 'mesh' },
  useSpring: ({ spring: target }: { spring: number }) => {
    springTargets.push(target);

    return {
      spring: {
        to: (_input: readonly number[], output: readonly number[]) =>
          output[target],
      },
    };
  },
}));
vi.doMock('@react-three/drei', () => ({
  useGLTF: createUseGltfMock({
    '/kitchen_interactives.gltf': fixture,
  }),
  useTexture: (path: string) => {
    const texture = textures.get(path) ?? new THREE.Texture();
    textures.set(path, texture);
    return texture;
  },
}));
vi.doMock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}));

let Neon: typeof import('./Neon').Neon;

beforeAll(async () => {
  ({ Neon } = await import('./Neon'));
});

beforeEach(() => {
  localStorage.clear();
  springTargets.length = 0;
  textures.clear();
  setState({
    ...initialState,
    achievements: {},
    gfxSettings: { ...initialState.gfxSettings },
    letters: {},
  });
});

function getRenderedNode(
  renderer: R3FTestHarness,
  name: NeonNodeName
) {
  const geometry = (fixture.nodes[name] as THREE.Mesh).geometry;
  const node = renderer.root.findAll(
    (candidate) =>
      (candidate.instance as THREE.Mesh).geometry === geometry
  )[0];

  if (!node) {
    throw new Error(`No rendered neon node found for ${name}.`);
  }

  return node;
}

function getNeonMaterials(renderer: R3FTestHarness) {
  return neonMaterialNodeNames.map(
    (name) => (getRenderedNode(renderer, name).instance as THREE.Mesh).material
  );
}

function expectDisabledNeonMaterials(renderer: R3FTestHarness): void {
  getNeonMaterials(renderer).forEach((material) => {
    expect(material).toBe(disabledNeonMaterial);
  });
}

test('blocks the switch while any required letter is missing', async () => {
  const incompleteLetterStates: InteractiveLetters[] = [
    { o: true, u: true, k: true },
    { t: true, u: true, k: true },
    { t: true, o: true, k: true },
    { t: true, o: true, u: true },
  ];

  for (const letters of incompleteLetterStates) {
    setState({ letters });
    springTargets.length = 0;

    const renderer = await render3D(<Neon />);

    try {
      await renderer.fireEvent(
        getRenderedNode(renderer, 'switch_button'),
        'click'
      );

      expect(springTargets).toEqual([0]);
      expect(getState().achievements[AchievementName.NEON]).toBeUndefined();
      expectDisabledNeonMaterials(renderer);
    } finally {
      await renderer.unmount();
    }
  }
});

test('enables and then disables all neon materials after collecting every letter', async () => {
  setState({
    letters: { t: true, o: true, u: true, k: true },
  });

  const renderer = await render3D(<Neon />);

  try {
    const switchButton = getRenderedNode(renderer, 'switch_button');
    expectDisabledNeonMaterials(renderer);

    await renderer.fireEvent(switchButton, 'click');

    expect(springTargets).toEqual([0, 1]);
    expect(getNeonMaterials(renderer)).toEqual([
      enabledMaterials.neonMaterialWhite,
      enabledMaterials.neonMaterialGreen,
      enabledMaterials.neonMaterialPurple,
    ]);
    expect(getState().achievements[AchievementName.NEON]).toBeDefined();

    await renderer.fireEvent(switchButton, 'click');

    expect(springTargets).toEqual([0, 1, 0]);
    expectDisabledNeonMaterials(renderer);
  } finally {
    await renderer.unmount();
  }
});

test('allows toggling after reload with an existing neon achievement', async () => {
  getState().setAchievement(AchievementName.NEON, {
    date: 'Sat May 16 2026',
    status: AchievementPayloadStatus.VIEWED,
  });
  setState({ letters: {} });

  const renderer = await render3D(<Neon />);

  try {
    const switchButton = getRenderedNode(renderer, 'switch_button');
    expect(getState().letters).toEqual({});
    expectDisabledNeonMaterials(renderer);

    await renderer.fireEvent(switchButton, 'click');

    expect(springTargets).toEqual([0, 1]);
    expect(getNeonMaterials(renderer)).toEqual([
      enabledMaterials.neonMaterialWhite,
      enabledMaterials.neonMaterialGreen,
      enabledMaterials.neonMaterialPurple,
    ]);

    await renderer.fireEvent(switchButton, 'click');

    expect(springTargets).toEqual([0, 1, 0]);
    expectDisabledNeonMaterials(renderer);
  } finally {
    await renderer.unmount();
  }
});
