import { hasComponent } from "bitecs";
import { Texture } from "three";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { ClientID, EntityID, NetworkID } from "./networking-types";

type CreatorID = NetworkID | ClientID;

function setInitialNetworkedDataIfUnset(eid: EntityID, nid: NetworkID, creator: CreatorID) {
  if (Networked.id[eid]) {
    return;
  }
  setInitialNetworkedData(eid, nid, creator);
}

function forEachObjectMaterial(obj: any, fn: (mat: any) => void) {
  if (!obj.material) return;
  if (Array.isArray(obj.material)) {
    obj.material.forEach(fn);
  } else {
    fn(obj.material);
  }
}

function assignNetworkedRenderAssetData(world: HubsWorld, rootEid: EntityID, creator: CreatorID) {
  const seenMaterials = new Set<number>();
  const seenTextures = new Set<number>();
  let materialIdx = 0;
  let textureIdx = 0;

  world.eid2obj.get(rootEid)!.traverse(obj => {
    if (!obj.eid || !hasComponent(world, Networked, obj.eid) || !Networked.id[obj.eid]) return;

    const objectNid = APP.getString(Networked.id[obj.eid])!;

    forEachObjectMaterial(obj, mat => {
      const matEid = mat?.eid as EntityID | undefined;
      if (!matEid || !hasComponent(world, Networked, matEid) || seenMaterials.has(matEid)) return;

      seenMaterials.add(matEid);
      setInitialNetworkedDataIfUnset(matEid, `${objectNid}.mat.${materialIdx}`, creator);
      materialIdx += 1;

      const materialNid = APP.getString(Networked.id[matEid])!;
      Object.values(mat).forEach(value => {
        if (!(value instanceof Texture)) return;
        const textureValue = value as Texture & { eid?: EntityID };
        const texEid = textureValue.eid;
        if (!texEid || !hasComponent(world, Networked, texEid) || seenTextures.has(texEid)) return;

        seenTextures.add(texEid);
        setInitialNetworkedDataIfUnset(texEid, `${materialNid}.tex.${textureIdx}`, materialNid);
        textureIdx += 1;
      });
    });
  });
}

export function setNetworkedDataWithRoot(world: HubsWorld, rootNid: NetworkID, eid: EntityID, creator: ClientID) {
  let i = 0;
  world.eid2obj.get(eid)!.traverse(function (o) {
    if (o.eid && hasComponent(world, Networked, o.eid)) {
      // TODO: Should non-root's creator just be "reticulum"?
      setInitialNetworkedData(o.eid, i === 0 ? rootNid : `${rootNid}.${i}`, i === 0 ? creator : rootNid);
      i += 1;
    }
  });

  // Materials/textures are not part of the Object3D graph, assign NIDs explicitly when networked.
  assignNetworkedRenderAssetData(world, eid, rootNid);
}

export function setNetworkedDataWithoutRoot(world: HubsWorld, rootNid: NetworkID, childEid: EntityID) {
  let i = 0;
  // TODO: Should creator just be "reticulum"?
  world.eid2obj.get(childEid)!.traverse(function (obj) {
    if (obj.eid && hasComponent(world, Networked, obj.eid)) {
      setInitialNetworkedData(obj.eid, `${rootNid}.${i}`, rootNid);
      i += 1;
    }
  });

  // Materials/textures are not part of the Object3D graph, assign NIDs explicitly when networked.
  assignNetworkedRenderAssetData(world, childEid, rootNid);
}

export function setInitialNetworkedData(eid: EntityID, nid: NetworkID, creator: CreatorID) {
  Networked.id[eid] = APP.getSid(nid);
  APP.world.nid2eid.set(Networked.id[eid], eid);
  Networked.creator[eid] = APP.getSid(creator);
  Networked.owner[eid] = APP.getSid("reticulum");
  Networked.lastOwnerTime[eid] = 0;
}
