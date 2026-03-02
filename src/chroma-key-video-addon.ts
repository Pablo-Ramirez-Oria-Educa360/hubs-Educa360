import { registerAddon } from "./addons";
import { chromaKeyVideoMaterialSystem } from "./bit-systems/chroma-key-video-system";
import { inflateChromaKeyVideo } from "./inflators/chroma-key-video";
import { SystemOrderE } from "./types";

registerAddon("hubs-chroma-key-video-addon", {
  name: "Chroma/Luma Key Video",
  description: "Aplica keying por shader en materiales de video usando MOZ_hubs_components.",
  inflator: {
    jsx: {
      id: "chromaKeyVideo",
      inflator: inflateChromaKeyVideo
    },
    gltf: {
      id: "chromaKeyVideo",
      inflator: inflateChromaKeyVideo
    }
  },
  system: {
    order: SystemOrderE.BeforeMatricesUpdate,
    system: app => chromaKeyVideoMaterialSystem(app.world)
  }
});
