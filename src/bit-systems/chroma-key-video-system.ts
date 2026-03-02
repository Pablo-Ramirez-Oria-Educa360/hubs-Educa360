import { defineQuery, entityExists, hasComponent } from "bitecs";
import { Material } from "three";
import { HubsWorld } from "../app";
import { MaterialTag, MediaInfo, MediaVideo, NetworkedVideo, Object3DTag } from "../bit-components";
import { ChromaKeyAlphaMode, ChromaKeyMode, ChromaKeyVideo } from "../components/chroma-key-video";

type ShaderLike = {
  uniforms: Record<string, { value: unknown }>;
  fragmentShader: string;
};

type MaterialWithCustomProgramCacheKey = Material & {
  transparent: boolean;
  alphaTest: number;
  depthWrite: boolean;
  onBeforeCompile: (shader: ShaderLike, renderer?: unknown) => void;
  customProgramCacheKey: () => string;
  needsUpdate: boolean;
  map?: unknown;
};

type PatchState = {
  material: MaterialWithCustomProgramCacheKey;
  shader: ShaderLike | null;
  originalOnBeforeCompile: MaterialWithCustomProgramCacheKey["onBeforeCompile"];
  originalCustomProgramCacheKey: MaterialWithCustomProgramCacheKey["customProgramCacheKey"];
  originalTransparent: boolean;
  originalAlphaTest: number;
  originalDepthWrite: boolean;
};

type RuntimeSettings = {
  mode: ChromaKeyMode;
  keyColor: [number, number, number];
  threshold: number;
  softness: number;
  despill: number;
  opacity: number;
  invert: 0 | 1;
  alphaMode: ChromaKeyAlphaMode;
  alphaCutoff: number;
};

const CK_UNIFORMS = {
  mode: "ck_mode",
  keyColor: "ck_keyColor",
  threshold: "ck_threshold",
  softness: "ck_softness",
  despill: "ck_despill",
  opacity: "ck_opacity",
  invert: "ck_invert",
  alphaMode: "ck_alphaMode",
  alphaCutoff: "ck_alphaCutoff"
} as const;

const CK_PATCH_MARKER = "// __hubs_chroma_key_video_patch__";
const CK_PATCH_KEY = "|hubs_ckv1";

const states = new Map<number, PatchState>();

const explicitQuery = defineQuery([ChromaKeyVideo]);
const mediaVideoQuery = defineQuery([MediaVideo]);

const AUTO_CHROMA_SETTINGS: RuntimeSettings = {
  mode: ChromaKeyMode.LUMA,
  keyColor: [0, 0, 0],
  // Strict luma-key defaults: remove near-pure black with hard edges.
  threshold: 0.02,
  softness: 0.0,
  despill: 0.0,
  opacity: 1.0,
  invert: 0,
  alphaMode: ChromaKeyAlphaMode.ALPHA_TEST,
  alphaCutoff: 0.5
};

function resolveMaterialForEntity(world: HubsWorld, eid: number): MaterialWithCustomProgramCacheKey | undefined {
  if (hasComponent(world, MaterialTag, eid)) {
    return world.eid2mat.get(eid) as MaterialWithCustomProgramCacheKey | undefined;
  }

  if (hasComponent(world, Object3DTag, eid)) {
    const obj = world.eid2obj.get(eid) as any;
    if (!obj?.material) return;

    return (Array.isArray(obj.material) ? obj.material[0] : obj.material) as MaterialWithCustomProgramCacheKey;
  }

  return undefined;
}

function setUniform(shader: ShaderLike | null, name: string, value: unknown) {
  if (!shader) return;
  if (!shader.uniforms[name]) return;
  shader.uniforms[name].value = value;
}

function readExplicitSettings(eid: number): RuntimeSettings {
  return {
    mode: ChromaKeyVideo.mode[eid],
    keyColor: [
      ChromaKeyVideo.keyColor[eid][0],
      ChromaKeyVideo.keyColor[eid][1],
      ChromaKeyVideo.keyColor[eid][2]
    ],
    threshold: ChromaKeyVideo.threshold[eid],
    softness: ChromaKeyVideo.softness[eid],
    despill: ChromaKeyVideo.despill[eid],
    opacity: ChromaKeyVideo.opacity[eid],
    invert: ChromaKeyVideo.invert[eid] ? 1 : 0,
    alphaMode: ChromaKeyVideo.alphaMode[eid],
    alphaCutoff: ChromaKeyVideo.alphaCutoff[eid]
  };
}

function getMediaSrc(world: HubsWorld, eid: number): string | null {
  if (hasComponent(world, MediaInfo, eid)) {
    const sid = MediaInfo.accessibleUrl[eid];
    if (sid) {
      const src = APP.getString(sid);
      if (src) return src;
    }
  }

  if (hasComponent(world, NetworkedVideo, eid)) {
    const sid = NetworkedVideo.src[eid];
    if (sid) {
      const src = APP.getString(sid);
      if (src) return src;
    }
  }

  return null;
}

function shouldAutoApplyByName(src: string | null): boolean {
  if (!src) return false;

  // 1) Explicit query flag (preferred): ?_chroma=1 / true / yes / on
  try {
    const url = new URL(src, window.location.href);
    if (url.searchParams.has("_chroma")) {
      const value = (url.searchParams.get("_chroma") || "").trim().toLowerCase();
      return value === "" || value === "1" || value === "true" || value === "yes" || value === "on";
    }

    // 2) Backward-compatible fallback: `_chroma` in filename/path.
    return decodeURIComponent(url.pathname).toLowerCase().includes("_chroma");
  } catch {
    return src.toLowerCase().includes("_chroma");
  }
}

function ensurePatchedShader(shader: ShaderLike) {
  if (shader.fragmentShader.includes(CK_PATCH_MARKER)) return;

  shader.uniforms[CK_UNIFORMS.mode] = { value: ChromaKeyMode.CHROMA };
  shader.uniforms[CK_UNIFORMS.keyColor] = { value: { x: 0, y: 0, z: 0 } };
  shader.uniforms[CK_UNIFORMS.threshold] = { value: 0.02 };
  shader.uniforms[CK_UNIFORMS.softness] = { value: 0.0 };
  shader.uniforms[CK_UNIFORMS.despill] = { value: 0.0 };
  shader.uniforms[CK_UNIFORMS.opacity] = { value: 1.0 };
  shader.uniforms[CK_UNIFORMS.invert] = { value: 0 };
  shader.uniforms[CK_UNIFORMS.alphaMode] = { value: ChromaKeyAlphaMode.ALPHA_TEST };
  shader.uniforms[CK_UNIFORMS.alphaCutoff] = { value: 0.5 };

  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <common>",
    `#include <common>
uniform int ${CK_UNIFORMS.mode};
uniform vec3 ${CK_UNIFORMS.keyColor};
uniform float ${CK_UNIFORMS.threshold};
uniform float ${CK_UNIFORMS.softness};
uniform float ${CK_UNIFORMS.despill};
uniform float ${CK_UNIFORMS.opacity};
uniform int ${CK_UNIFORMS.invert};
uniform int ${CK_UNIFORMS.alphaMode};
uniform float ${CK_UNIFORMS.alphaCutoff};

float ck_luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

float ck_compute_alpha(vec3 rgb) {
  float soft = max(${CK_UNIFORMS.softness}, 0.0);
  float a;
  if (${CK_UNIFORMS.mode} == ${ChromaKeyMode.LUMA}) {
    float lum = ck_luma(rgb);
    if (soft <= 0.000001) {
      a = step(${CK_UNIFORMS.threshold}, lum);
    } else {
      a = smoothstep(${CK_UNIFORMS.threshold}, ${CK_UNIFORMS.threshold} + soft, lum);
    }
    if (${CK_UNIFORMS.invert} == 1) {
      a = 1.0 - a;
    }
  } else {
    float d = distance(rgb, ${CK_UNIFORMS.keyColor});
    if (soft <= 0.000001) {
      a = step(${CK_UNIFORMS.threshold}, d);
    } else {
      a = smoothstep(${CK_UNIFORMS.threshold}, ${CK_UNIFORMS.threshold} + soft, d);
    }
  }
  return a;
}

vec3 ck_apply_despill(vec3 rgb, float alpha) {
  float spill = max(0.0, rgb.g - max(rgb.r, rgb.b));
  float k = ${CK_UNIFORMS.despill} * (1.0 - alpha);
  rgb.g -= spill * k;
  return rgb;
}
`
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <map_fragment>",
    `#include <map_fragment>
${CK_PATCH_MARKER}
{
  float ckAlpha = ck_compute_alpha(diffuseColor.rgb);
  diffuseColor.rgb = ck_apply_despill(diffuseColor.rgb, ckAlpha);
  diffuseColor.a *= ckAlpha * ${CK_UNIFORMS.opacity};

  if (${CK_UNIFORMS.alphaMode} == ${ChromaKeyAlphaMode.ALPHA_TEST}) {
    if (diffuseColor.a < ${CK_UNIFORMS.alphaCutoff}) discard;
    diffuseColor.a = 1.0;
  }
}
`
  );
}

function applyMaterialAlphaState(mat: MaterialWithCustomProgramCacheKey, settings: RuntimeSettings) {
  if (settings.alphaMode === ChromaKeyAlphaMode.ALPHA_TEST) {
    mat.transparent = false;
    mat.alphaTest = settings.alphaCutoff;
    mat.depthWrite = true;
  } else {
    mat.transparent = true;
    mat.alphaTest = 0;
    mat.depthWrite = false;
  }
}

function patchMaterial(eid: number, mat: MaterialWithCustomProgramCacheKey) {
  if (states.has(eid)) return;

  const state: PatchState = {
    material: mat,
    shader: null,
    originalOnBeforeCompile: mat.onBeforeCompile,
    originalCustomProgramCacheKey: mat.customProgramCacheKey,
    originalTransparent: mat.transparent,
    originalAlphaTest: mat.alphaTest,
    originalDepthWrite: mat.depthWrite
  };

  mat.onBeforeCompile = (shader, renderer) => {
    if (state.originalOnBeforeCompile) {
      state.originalOnBeforeCompile.call(mat, shader, renderer);
    }
    ensurePatchedShader(shader);
    state.shader = shader;
  };

  mat.customProgramCacheKey = () => {
    const originalKey = state.originalCustomProgramCacheKey ? state.originalCustomProgramCacheKey.call(mat) : "";
    return `${originalKey}${CK_PATCH_KEY}`;
  };

  mat.needsUpdate = true;

  states.set(eid, state);
}

function unpatchMaterial(eid: number) {
  const state = states.get(eid);
  if (!state) return;

  const mat = state.material;
  mat.onBeforeCompile = state.originalOnBeforeCompile;
  mat.customProgramCacheKey = state.originalCustomProgramCacheKey;
  mat.transparent = state.originalTransparent;
  mat.alphaTest = state.originalAlphaTest;
  mat.depthWrite = state.originalDepthWrite;
  mat.needsUpdate = true;

  states.delete(eid);
}

function updateUniforms(eid: number, settings: RuntimeSettings) {
  const state = states.get(eid);
  if (!state || !state.shader) return;

  setUniform(state.shader, CK_UNIFORMS.mode, settings.mode);
  setUniform(state.shader, CK_UNIFORMS.keyColor, {
    x: settings.keyColor[0],
    y: settings.keyColor[1],
    z: settings.keyColor[2]
  });
  setUniform(state.shader, CK_UNIFORMS.threshold, settings.threshold);
  setUniform(state.shader, CK_UNIFORMS.softness, settings.softness);
  setUniform(state.shader, CK_UNIFORMS.despill, settings.despill);
  setUniform(state.shader, CK_UNIFORMS.opacity, settings.opacity);
  setUniform(state.shader, CK_UNIFORMS.invert, settings.invert);
  setUniform(state.shader, CK_UNIFORMS.alphaMode, settings.alphaMode);
  setUniform(state.shader, CK_UNIFORMS.alphaCutoff, settings.alphaCutoff);
}

function ensurePatchedWithSettings(
  eid: number,
  mat: MaterialWithCustomProgramCacheKey,
  settings: RuntimeSettings
) {
  let state = states.get(eid);
  if (!state) {
    patchMaterial(eid, mat);
    state = states.get(eid);
  } else if (state.material !== mat) {
    unpatchMaterial(eid);
    patchMaterial(eid, mat);
    state = states.get(eid);
  }
  if (!state) return;

  applyMaterialAlphaState(state.material, settings);
  updateUniforms(eid, settings);
}

export function chromaKeyVideoMaterialSystem(world: HubsWorld) {
  const desiredEids = new Set<number>();
  const explicitMaterials = new Set<MaterialWithCustomProgramCacheKey>();

  explicitQuery(world).forEach(eid => {
    if (!entityExists(world, eid)) return;
    const mat = resolveMaterialForEntity(world, eid);
    if (!mat) return;

    desiredEids.add(eid);
    explicitMaterials.add(mat);
    ensurePatchedWithSettings(eid, mat, readExplicitSettings(eid));
  });

  mediaVideoQuery(world).forEach(eid => {
    if (!entityExists(world, eid)) return;
    if (hasComponent(world, ChromaKeyVideo, eid)) return;

    const src = getMediaSrc(world, eid);
    if (!shouldAutoApplyByName(src)) return;

    const mat = resolveMaterialForEntity(world, eid);
    if (!mat) return;
    if (explicitMaterials.has(mat)) return;

    desiredEids.add(eid);
    ensurePatchedWithSettings(eid, mat, AUTO_CHROMA_SETTINGS);
  });

  states.forEach((_state, eid) => {
    if (!desiredEids.has(eid) || !entityExists(world, eid)) {
      unpatchMaterial(eid);
    }
  });
}
