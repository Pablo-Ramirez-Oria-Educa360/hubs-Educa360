/** @jsx createElementEntity */
import { createElementEntity, renderAsEntity } from "../utils/jsx-entity";
import { HubsWorld } from "../app";
import { guessContentType, hubIdFromUrl } from "./media-url-utils";
import { createImageDef } from "./load-image";
import { EntityID } from "./networking-types";
import { ObjectMenuTarget } from "../bit-components";
import { ObjectMenuTargetFlags } from "../inflators/object-menu-target";

// 1x1 transparent PNG. Used to avoid requiring a thumbnail for link/teleport cards.
const TRANSPARENT_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X9Z0AAAAASUVORK5CYII=";

export function* loadHtml(world: HubsWorld, eid: EntityID, url: string, thumbnailUrl: string) {
  const hubId = hubIdFromUrl(url);
  const isTeleportLink = (() => {
    if (!hubId) return false;
    try {
      const parsed = new URL(url);
      return !!parsed.hash && window.APP?.hub?.hub_id === hubId;
    } catch {
      return false;
    }
  })();

  const shouldHideImage = isTeleportLink || !thumbnailUrl;
  // If we're hiding the image anyway, don't fetch the thumbnail.
  const imageUrl = shouldHideImage ? TRANSPARENT_PNG : thumbnailUrl;
  const imageDef = yield* createImageDef(world, imageUrl, guessContentType(imageUrl) || "image/png");

  ObjectMenuTarget.flags[eid] |= ObjectMenuTargetFlags.Flat;

  const htmlEid = renderAsEntity(
    world,
    <entity
      name="HTML"
      image={imageDef}
      grabbable={{ cursor: true, hand: false }}
      link={{ href: url }}
      objectMenuTarget={{ isFlat: true }}
    />
  );

  // Hide destination thumbnail for teleport links (and when thumbnail is missing), keeping the mesh for raycasting/menus.
  if (shouldHideImage) {
    const obj = world.eid2obj.get(htmlEid) as any;
    if (obj?.material) {
      obj.material.transparent = true;
      obj.material.opacity = 0;
      obj.material.depthWrite = false;
      obj.material.needsUpdate = true;
    }
  }

  return htmlEid;
}
