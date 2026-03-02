import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { Material } from "three";
import { HubsWorld } from "../app";
import { MaterialTag, Object3DTag } from "../bit-components";
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

const query = defineQuery([ChromaKeyVideo]);
const enterQ = enterQuery(query);
const exitQ = exitQuery(query);

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

function ensurePatchedShader(shader: ShaderLike) {
  if (shader.fragmentShader.includes(CK_PATCH_MARKER)) return;

  shader.uniforms[CK_UNIFORMS.mode] = { value: ChromaKeyMode.CHROMA };
  shader.uniforms[CK_UNIFORMS.keyColor] = { value: { x: 0, y: 0, z: 0 } };
  shader.uniforms[CK_UNIFORMS.threshold] = { value: 0.2 };
  shader.uniforms[CK_UNIFORMS.softness] = { value: 0.1 };
  shader.uniforms[CK_UNIFORMS.despill] = { value: 0.15 };
  shader.uniforms[CK_UNIFORMS.opacity] = { value: 1.0 };
  shader.uniforms[CK_UNIFORMS.invert] = { value: 0 };
  shader.uniforms[CK_UNIFORMS.alphaMode] = { value: ChromaKeyAlphaMode.ALPHA_TEST };
  shader.uniforms[CK_UNIFORMS.alphaCutoff] = { value: 0.05 };

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
  float a;
  if (${CK_UNIFORMS.mode} == ${ChromaKeyMode.LUMA}) {
    float lum = ck_luma(rgb);
    a = smoothstep(${CK_UNIFORMS.threshold}, ${CK_UNIFORMS.threshold} + ${CK_UNIFORMS.softness}, lum);
    if (${CK_UNIFORMS.invert} == 1) {
      a = 1.0 - a;
    }
  } else {
    float d = distance(rgb, ${CK_UNIFORMS.keyColor});
    a = smoothstep(${CK_UNIFORMS.threshold}, ${CK_UNIFORMS.threshold} + ${CK_UNIFORMS.softness}, d);
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

function applyMaterialAlphaState(eid: number, mat: MaterialWithCustomProgramCacheKey) {
  if (ChromaKeyVideo.alphaMode[eid] === ChromaKeyAlphaMode.ALPHA_TEST) {
    mat.transparent = false;
    mat.alphaTest = ChromaKeyVideo.alphaCutoff[eid];
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
      state.originalOnBeforeCompile(shader, renderer);
    }
    ensurePatchedShader(shader);
    state.shader = shader;
  };

  mat.customProgramCacheKey = () => {
    const originalKey = state.originalCustomProgramCacheKey ? state.originalCustomProgramCacheKey() : "";
    return `${originalKey}${CK_PATCH_KEY}`;
  };

  applyMaterialAlphaState(eid, mat);
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

function updateUniforms(eid: number) {
  const state = states.get(eid);
  if (!state || !state.shader) return;

  setUniform(state.shader, CK_UNIFORMS.mode, ChromaKeyVideo.mode[eid]);
  setUniform(state.shader, CK_UNIFORMS.keyColor, {
    x: ChromaKeyVideo.keyColor[eid][0],
    y: ChromaKeyVideo.keyColor[eid][1],
    z: ChromaKeyVideo.keyColor[eid][2]
  });
  setUniform(state.shader, CK_UNIFORMS.threshold, ChromaKeyVideo.threshold[eid]);
  setUniform(state.shader, CK_UNIFORMS.softness, ChromaKeyVideo.softness[eid]);
  setUniform(state.shader, CK_UNIFORMS.despill, ChromaKeyVideo.despill[eid]);
  setUniform(state.shader, CK_UNIFORMS.opacity, ChromaKeyVideo.opacity[eid]);
  setUniform(state.shader, CK_UNIFORMS.invert, ChromaKeyVideo.invert[eid]);
  setUniform(state.shader, CK_UNIFORMS.alphaMode, ChromaKeyVideo.alphaMode[eid]);
  setUniform(state.shader, CK_UNIFORMS.alphaCutoff, ChromaKeyVideo.alphaCutoff[eid]);
}

export function chromaKeyVideoMaterialSystem(world: HubsWorld) {
  enterQ(world).forEach(eid => {
    const mat = resolveMaterialForEntity(world, eid);
    if (mat) patchMaterial(eid, mat);
  });

  query(world).forEach(eid => {
    if (!entityExists(world, eid)) return;
    const mat = resolveMaterialForEntity(world, eid);
    if (!mat) return;

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

    applyMaterialAlphaState(eid, state.material);
    updateUniforms(eid);
  });

  exitQ(world).forEach(eid => unpatchMaterial(eid));
}
