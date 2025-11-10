declare module "components-*" {
  const mod: any;
  export = mod;
}

declare module "components-*/*" {
  const mod: any;
  export = mod;
}

declare module "utils-*" {
  const mod: any;
  export = mod;
}

declare module "utils-*/*" {
  const mod: any;
  export = mod;
}

declare module "constants-shared" {
  const mod: any;
  export = mod;
}

declare module "constants-shared/*" {
  const mod: any;
  export = mod;
}

declare module "pixi-svelte-storybook" {
  const mod: any;
  export = mod;
}

declare module "config-*" {
  const mod: any;
  export = mod;
}

declare module "*.cjs" {
  const mod: any;
  export default mod;
}
