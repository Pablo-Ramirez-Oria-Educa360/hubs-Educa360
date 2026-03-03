import { AlphaMode, create360ImageMesh, createImageMesh } from "../utils/create-image-mesh";
import { addComponent } from "bitecs";
import { addObject3DComponent } from "../utils/jsx-entity";
import { ProjectionMode } from "../utils/projection-mode";
import { MediaVideo, MediaVideoData, NetworkedVideo } from "../bit-components";
import { HubsWorld } from "../app";
import { EntityID } from "../utils/networking-types";
import { Texture } from "three";

export const VIDEO_FLAGS = {
  CONTROLS: 1 << 0,
  AUTO_PLAY: 1 << 1,
  LOOP: 1 << 2,
  PAUSED: 1 << 3
};

export interface VideoParams {
  texture: Texture;
  ratio: number;
  projection: ProjectionMode;
  video: HTMLVideoElement;
  controls: boolean;
  alphaMode?: AlphaMode;
  alphaCutoff?: number;
}

const DEFAULTS: Partial<VideoParams> = {
  projection: ProjectionMode.FLAT,
  controls: true,
  ratio: 1,
  alphaMode: AlphaMode.OPAQUE,
  alphaCutoff: 0.5
};

export function inflateVideo(world: HubsWorld, eid: EntityID, params: VideoParams) {
  const requiredParams = Object.assign({}, DEFAULTS, params) as Required<VideoParams>;
  const { texture, ratio, projection, video, alphaMode, alphaCutoff } = requiredParams;
  const mesh =
    projection === ProjectionMode.SPHERE_EQUIRECTANGULAR
      ? create360ImageMesh(texture, alphaMode, alphaCutoff)
      : createImageMesh(texture, ratio, alphaMode, alphaCutoff);
  addObject3DComponent(world, eid, mesh);
  addComponent(world, MediaVideo, eid);

  MediaVideo.flags[eid] = 0;
  if (!!requiredParams.controls) {
    MediaVideo.flags[eid] |= VIDEO_FLAGS.CONTROLS;
  }
  MediaVideo.projection[eid] = requiredParams.projection;
  MediaVideo.ratio[eid] = requiredParams.ratio;
  MediaVideo.lastUpdate[eid] = 0;
  MediaVideoData.set(eid, video);
  return eid;
}
