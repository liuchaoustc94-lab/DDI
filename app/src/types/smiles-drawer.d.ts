declare module "smiles-drawer" {
  type DrawTarget = HTMLCanvasElement | SVGElement | HTMLImageElement | string | null;

  interface DrawerOptions {
    width?: number;
    height?: number;
    bondThickness?: number;
    bondLength?: number;
    shortBondLength?: number;
    bondSpacing?: number;
    atomVisualization?: string;
    terminalCarbons?: boolean;
    explicitHydrogens?: boolean;
    overlapSensitivity?: number;
    compactDrawing?: boolean;
    fontFamily?: string;
    fontSize?: number;
    padding?: number;
    experimentalSSSR?: boolean;
    themes?: Record<string, Record<string, string>>;
  }

  class SmiDrawer {
    constructor(options?: DrawerOptions);
    draw(
      smiles: string,
      target: DrawTarget,
      theme?: string,
      successCallback?: ((target: DrawTarget) => void) | null,
      errorCallback?: ((err: unknown) => void) | null,
      weights?: number[] | null
    ): void;
  }

  class Drawer {
    constructor(options?: DrawerOptions);
    draw(tree: unknown, canvas: HTMLCanvasElement, theme: string): void;
  }

  const SmilesDrawerNS: {
    Version: string;
    Drawer: typeof Drawer;
    SmiDrawer: typeof SmiDrawer;
    SvgDrawer: unknown;
    GaussDrawer: unknown;
    Parser: unknown;
    ReactionDrawer: unknown;
    ReactionParser: unknown;
    clean: (smiles: string) => string;
    apply: (options: DrawerOptions, selector?: string, themeName?: string, onError?: ((err: unknown) => void) | null) => void;
  };

  export default SmilesDrawerNS;
}
