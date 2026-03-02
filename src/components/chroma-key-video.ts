import { defineComponent, Types } from "bitecs";

export enum ChromaKeyMode {
  CHROMA = 0,
  LUMA = 1
}

export enum ChromaKeyAlphaMode {
  BLEND = 0,
  ALPHA_TEST = 1
}

export const ChromaKeyVideo = defineComponent({
  mode: Types.ui8,
  keyColor: [Types.f32, 3],
  threshold: Types.f32,
  softness: Types.f32,
  despill: Types.f32,
  opacity: Types.f32,
  invert: Types.ui8,
  alphaMode: Types.ui8,
  alphaCutoff: Types.f32
});
