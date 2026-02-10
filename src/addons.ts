import type { GLTFLoaderPlugin, GLTFParser } from "three/examples/jsm/loaders/GLTFLoader";
import type { Object3D } from "three";
import type { Pass } from "postprocessing";

import type { App, HubsWorld } from "./app";
import { prefabs } from "./prefabs/prefabs";
import configs from "./utils/configs";
import { commonInflators, gltfInflators, jsxInflators } from "./utils/jsx-entity";
import { networkableComponents, schemas } from "./utils/network-schemas";
import { gltfPluginsExtra } from "./components/gltf-model-plus";
import type { GLTFLinkResolverFn } from "./inflators/model";
import { gltfLinkResolvers } from "./inflators/model";
import { extraSections } from "./react-components/debug-panel/ECSSidebar";
import { shouldUseNewLoader } from "./utils/bit-utils";
import { SCHEMA } from "./storage/store";
import { PostProcessOrderE, SystemOrderE } from "./types";
import type {
  InflatorConfigT,
  SystemConfigT,
  PrefabConfigT,
  NetworkSchemaConfigT,
  ChatCommandConfigT,
  PreferenceConfigT,
  PreferencePrefsScreenItemT,
  PreferencePrefsScreenCategory,
  PreferenceScreenLabelT,
  PreferenceScreenDefT,
  PreferenceDefConfigT,
} from "./types";

function getNextIdx(slot: Array<SystemConfigT>, system: SystemConfigT) {
  const idx = slot.findIndex(item => item.order > system.order);
  return idx === -1 ? slot.length : idx;
}

function registerSystem(system: SystemConfigT) {
  let slot = APP.addon_systems.prePhysics;
  if (system.order < SystemOrderE.PrePhysics) {
    slot = APP.addon_systems.setup;
  } else if (system.order < SystemOrderE.PostPhysics) {
    slot = APP.addon_systems.prePhysics;
  } else if (system.order < SystemOrderE.BeforeMatricesUpdate) {
    slot = APP.addon_systems.postPhysics;
  } else if (system.order < SystemOrderE.BeforeRender) {
    slot = APP.addon_systems.beforeMatricesUpdate;
  } else if (system.order < SystemOrderE.AfterRender) {
    slot = APP.addon_systems.beforeRender;
  } else {
    slot = APP.addon_systems.afterRender;
  }

  const nextIdx = getNextIdx(slot, system);
  slot.splice(nextIdx, 0, system);
}

function registerInflator(inflator: InflatorConfigT) {
  if (inflator.common) {
    (commonInflators as any)[inflator.common.id] = inflator.common.inflator;
  } else {
    if (inflator.jsx) {
      (jsxInflators as any)[inflator.jsx.id] = inflator.jsx.inflator;
    }
    if (inflator.gltf) {
      (gltfInflators as any)[inflator.gltf.id] = inflator.gltf.inflator;
    }
  }
}

function registerPrefab(prefab: PrefabConfigT) {
  if (prefabs.has(prefab.id as any)) {
    throw new Error(`Error registering prefab ${prefab.id}: prefab already registered`);
  }
  prefabs.set(prefab.id as any, prefab.config as any);
}

function registerNetworkSchema(schemaConfig: NetworkSchemaConfigT) {
  if (schemas.has(schemaConfig.component)) {
    throw new Error(
      `Error registering network schema ${schemaConfig.schema.componentName}: network schema already registered`
    );
  }
  schemas.set(schemaConfig.component, schemaConfig.schema);
  networkableComponents.push(schemaConfig.component);
}

function registerChatCommand(command: ChatCommandConfigT) {
  APP.messageDispatch.registerChatCommand(command.id, command.command);
}

export type AddonIdT = string;
export type AddonNameT = string;
export type AddonDescriptionT = string;
export type AddonOnLoadedFn = () => void;
export type AddonOnReadyFn = (app: App, config?: JSON) => void;

export interface InternalAddonConfigT {
  name: AddonNameT;
  description?: AddonDescriptionT;
  onLoaded?: AddonOnLoadedFn;
  onReady?: AddonOnReadyFn;
  system?: SystemConfigT | SystemConfigT[];
  inflator?: InflatorConfigT | InflatorConfigT[];
  prefab?: PrefabConfigT | PrefabConfigT[];
  networkSchema?: NetworkSchemaConfigT | NetworkSchemaConfigT[];
  chatCommand?: ChatCommandConfigT | ChatCommandConfigT[];
  preference?: PreferenceConfigT | PreferenceConfigT[];
  enabled?: boolean;
  config?: JSON | undefined;
}

type AddonConfigT = Omit<InternalAddonConfigT, "enabled" | "config">;
export type AdminAddonConfig = {
  enabled: boolean;
  config: JSON;
};

export const addons = new Map<AddonIdT, AddonConfigT>();
const pendingAddons = new Map<AddonIdT, InternalAddonConfigT>();

export function registerAddon(id: AddonIdT, config: AddonConfigT) {
  if (pendingAddons.has(id) || addons.has(id)) throw new Error(`Addon ${id} already registered`);
  console.log(`Add-on ${id} registered`);
  pendingAddons.set(id, config);
  registerPreferences(id, config);
  if (config.onLoaded) {
    config.onLoaded();
  }
}

export type GLTFParserCallbackFn = (parser: GLTFParser) => GLTFLoaderPlugin;
export function registerGLTFLoaderPlugin(callback: GLTFParserCallbackFn): void {
  gltfPluginsExtra.push(callback);
}

export function registerGLTFLinkResolver(resolver: GLTFLinkResolverFn): void {
  gltfLinkResolvers.push(resolver);
}

export function registerECSSidebarSection(section: (world: HubsWorld, setSelectedObj: (obj: Object3D) => void) => any) {
  extraSections.push(section);
}

const screenPreferencesDefs = new Map<string, PreferenceDefConfigT>();
export function getAddonsPreferencesDefs(): PreferenceScreenDefT {
  return screenPreferencesDefs;
}

const screenPreferencesLabels = new Map<string, string>();
export function getAddonsPreferencesLabels(): PreferenceScreenLabelT {
  return screenPreferencesLabels;
}

let xFormedScreenPreferencesCategories: Map<string, PreferencePrefsScreenItemT[]>;
const screenPreferencesCategories = new Map<string, PreferencePrefsScreenItemT[]>();
export function getAddonsPreferencesCategories(app: App): PreferencePrefsScreenCategory {
  if (!xFormedScreenPreferencesCategories) {
    xFormedScreenPreferencesCategories = new Map<string, PreferencePrefsScreenItemT[]>();
    screenPreferencesCategories.forEach((categories, addonId) => {
      if (isAddonActive(app, addonId)) {
        const config = addons.get(addonId);
        xFormedScreenPreferencesCategories.set(config?.name || addonId, categories);
      }
    });
    return xFormedScreenPreferencesCategories;
  } else {
    return xFormedScreenPreferencesCategories;
  }
}

function registerPreferences(addonId: string, addonConfig: AddonConfigT) {
  const prefSchema = (SCHEMA as any).definitions.preferences.properties;
  function register(preference: PreferenceConfigT) {
    for (const key in preference) {
      if (!(key in prefSchema)) {
        const prefDef = preference[key].prefDefinition;
        (prefSchema as any)[key] = prefDef;
        screenPreferencesDefs.set(key, prefDef);

        const prefConfig = preference[key];
        let categoryPrefs: PreferencePrefsScreenItemT[];
        if (screenPreferencesCategories.has(addonId)) {
          categoryPrefs = screenPreferencesCategories.get(addonId)!;
        } else {
          categoryPrefs = new Array<PreferencePrefsScreenItemT>();
          screenPreferencesCategories.set(addonId, categoryPrefs);
        }
        categoryPrefs.push({ key, ...prefConfig.prefConfig } as any);
        screenPreferencesLabels.set(key, prefConfig.prefConfig.description);
      } else {
        throw new Error(`Preference already exists: ${key}`);
      }
    }
  }

  if (addonConfig.preference) {
    if (Array.isArray(addonConfig.preference)) {
      addonConfig.preference.forEach(preference => register(preference));
    } else {
      register(addonConfig.preference);
    }
  }
}

const fxOrder2Passes: Record<number, number> = {
  [PostProcessOrderE.AfterScene]: 0,
  [PostProcessOrderE.AfterBloom]: 0,
  [PostProcessOrderE.AfterUI]: 0,
  [PostProcessOrderE.AfterAA]: 0
};
const fx2Order = new Map<Pass, PostProcessOrderE>();

function afterSceneIdx() {
  return 2 + fxOrder2Passes[PostProcessOrderE.AfterScene];
}
function afterBloomIdx(app: App) {
  let idx = afterSceneIdx();
  idx += fxOrder2Passes[PostProcessOrderE.AfterBloom];
  if (app.fx.bloomAndTonemapPass) idx++;
  return idx;
}
function afterUIIdx(app: App) {
  let idx = afterBloomIdx(app);
  idx += fxOrder2Passes[PostProcessOrderE.AfterUI];
  return idx;
}
function afterAAIdx(app: App) {
  let idx = afterUIIdx(app);
  idx += fxOrder2Passes[PostProcessOrderE.AfterAA];
  return idx;
}
function getPassIdx(app: App, order: PostProcessOrderE) {
  switch (order) {
    case PostProcessOrderE.AfterScene:
      return afterSceneIdx();
    case PostProcessOrderE.AfterBloom:
      return afterBloomIdx(app);
    case PostProcessOrderE.AfterUI:
      return afterUIIdx(app);
    case PostProcessOrderE.AfterAA:
      return afterAAIdx(app);
  }
}

export function registerPass(app: App, pass: Pass | Pass[], order: PostProcessOrderE) {
  function registerOne(p: Pass) {
    const nextIdx = getPassIdx(app, order) + 1;
    fx2Order.set(p, order);
    fxOrder2Passes[order]++;
    app.fx.composer?.addPass(p, nextIdx);
  }

  if (Array.isArray(pass)) {
    pass.forEach(p => registerOne(p));
  } else {
    registerOne(pass);
  }
}

export function unregisterPass(app: App, pass: Pass | Pass[]) {
  function unregisterOne(p: Pass) {
    if (fx2Order.has(p)) {
      const order = fx2Order.get(p)!;
      fxOrder2Passes[order]--;
      app.fx.composer?.removePass(p);
      fx2Order.delete(p);
    }
  }

  if (Array.isArray(pass)) {
    pass.forEach(p => unregisterOne(p));
  } else {
    unregisterOne(pass);
  }
}

export function getAddonConfig(id: string): AdminAddonConfig {
  const adminAddonsConfig = configs.feature("addons_config");
  let adminAddonConfig: AdminAddonConfig = { enabled: false, config: {} as JSON };
  if (adminAddonsConfig && id in adminAddonsConfig) {
    adminAddonConfig = adminAddonsConfig[id];
  }
  return adminAddonConfig;
}

export function isAddonEnabled(app: App, id: string): boolean {
  let enabled = false;
  if (app.hub?.user_data && "addons" in app.hub.user_data && id in app.hub.user_data.addons) {
    enabled = !!app.hub.user_data.addons[id];
  } else {
    enabled = !!getAddonConfig(id)?.enabled;
  }
  return enabled;
}

function isAddonActive(app: App, id: string): boolean {
  if (shouldUseNewLoader()) {
    return isAddonEnabled(app, id);
  }
  return false;
}

export function onAddonsInit(app: App) {
  app.scene?.addEventListener("hub_updated", () => {
    for (const [id, addon] of pendingAddons) {
      addons.set(id, addon);

      if (!isAddonActive(app, id)) {
        continue;
      }

      if (addon.prefab) {
        (Array.isArray(addon.prefab) ? addon.prefab : [addon.prefab]).forEach(registerPrefab);
      }

      if (addon.networkSchema) {
        (Array.isArray(addon.networkSchema) ? addon.networkSchema : [addon.networkSchema]).forEach(registerNetworkSchema);
      }

      if (addon.inflator) {
        (Array.isArray(addon.inflator) ? addon.inflator : [addon.inflator]).forEach(registerInflator);
      }

      if (addon.system) {
        (Array.isArray(addon.system) ? addon.system : [addon.system]).forEach(registerSystem);
      }

      if (addon.chatCommand) {
        (Array.isArray(addon.chatCommand) ? addon.chatCommand : [addon.chatCommand]).forEach(registerChatCommand);
      }

      if (addon.onReady) {
        const adminAddonConfig = getAddonConfig(id);
        addon.onReady(app, adminAddonConfig.config);
      }
    }
    pendingAddons.clear();
  });
}
