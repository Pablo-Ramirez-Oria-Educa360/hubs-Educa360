import { addComponent } from "bitecs";
import { Color } from "three";
import { HubsWorld } from "../app";
import { ChromaKeyAlphaMode, ChromaKeyMode, ChromaKeyVideo } from "../components/chroma-key-video";

type KeyColor = [number, number, number];

export type ChromaKeyVideoParams = Partial<{
  mode: ChromaKeyMode | "chroma" | "luma";
  keyColor: KeyColor | string;
  threshold: number;
  softness: number;
  despill: number;
  opacity: number;
  invert: boolean | 0 | 1;
  alphaMode: ChromaKeyAlphaMode | "blend" | "alphaTest" | "alpha_test";
  alphaCutoff: number;
}>;

const _color = new Color();

const DEFAULTS: Required<{
  mode: ChromaKeyMode;
  keyColor: KeyColor;
  threshold: number;
  softness: number;
  despill: number;
  opacity: number;
  invert: boolean;
  alphaMode: ChromaKeyAlphaMode;
  alphaCutoff: number;
}> = {
  mode: ChromaKeyMode.CHROMA,
  keyColor: [0, 0, 0],
  threshold: 0.2,
  softness: 0.1,
  despill: 0.15,
  opacity: 1.0,
  invert: false,
  alphaMode: ChromaKeyAlphaMode.ALPHA_TEST,
  alphaCutoff: 0.05
};

function normalizeMode(mode: ChromaKeyVideoParams["mode"]): ChromaKeyMode {
  if (mode === ChromaKeyMode.LUMA || mode === "luma") {
    return ChromaKeyMode.LUMA;
  }
  return ChromaKeyMode.CHROMA;
}

function normalizeAlphaMode(mode: ChromaKeyVideoParams["alphaMode"]): ChromaKeyAlphaMode {
  if (mode === ChromaKeyAlphaMode.BLEND || mode === "blend") {
    return ChromaKeyAlphaMode.BLEND;
  }
  return ChromaKeyAlphaMode.ALPHA_TEST;
}

function normalizeKeyColor(keyColor: ChromaKeyVideoParams["keyColor"]): KeyColor {
  if (Array.isArray(keyColor) && keyColor.length === 3) {
    return [
      Number.isFinite(keyColor[0]) ? keyColor[0] : DEFAULTS.keyColor[0],
      Number.isFinite(keyColor[1]) ? keyColor[1] : DEFAULTS.keyColor[1],
      Number.isFinite(keyColor[2]) ? keyColor[2] : DEFAULTS.keyColor[2]
    ];
  }

  if (typeof keyColor === "string") {
    _color.set(keyColor);
    return [_color.r, _color.g, _color.b];
  }

  return DEFAULTS.keyColor;
}

export function inflateChromaKeyVideo(world: HubsWorld, eid: number, params: ChromaKeyVideoParams = {}) {
  const p = {
    ...DEFAULTS,
    ...params
  };

  addComponent(world, ChromaKeyVideo, eid, true);
  ChromaKeyVideo.mode[eid] = normalizeMode(p.mode);
  ChromaKeyVideo.keyColor[eid].set(normalizeKeyColor(p.keyColor));
  ChromaKeyVideo.threshold[eid] = p.threshold;
  ChromaKeyVideo.softness[eid] = p.softness;
  ChromaKeyVideo.despill[eid] = p.despill;
  ChromaKeyVideo.opacity[eid] = p.opacity;
  ChromaKeyVideo.invert[eid] = p.invert ? 1 : 0;
  ChromaKeyVideo.alphaMode[eid] = normalizeAlphaMode(p.alphaMode);
  ChromaKeyVideo.alphaCutoff[eid] = p.alphaCutoff;
}
