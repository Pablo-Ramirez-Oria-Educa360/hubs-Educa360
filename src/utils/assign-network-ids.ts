import { hasComponent } from "bitecs";
import { Texture } from "three";
import { HubsWorld } from "../app";
import { Networked } from "../bit-components";
import { ClientID, EntityID, NetworkID } from "./networking-types";

type CreatorID = NetworkID | ClientID;
type BehaviorGraphNode = {
  configuration?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
};

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

function getNodeMaterialTarget(node: BehaviorGraphNode): EntityID | undefined {
  const fromConfigMaterial = node.configuration?.material;
  if (typeof fromConfigMaterial === "number" && Number.isFinite(fromConfigMaterial)) {
    return fromConfigMaterial;
  }

  const fromParamsMaterial = (node.parameters as any)?.material?.value;
  if (typeof fromParamsMaterial === "number" && Number.isFinite(fromParamsMaterial)) {
    return fromParamsMaterial;
  }

  return undefined;
}

function forEachBehaviorGraphMaterialEid(rootObj: any, fn: (matEid: EntityID) => void) {
  const graph = rootObj?.userData?.behaviorGraph as { nodes?: unknown[] | Record<string, unknown> } | undefined;
  if (!graph?.nodes) return;

  const nodes = Array.isArray(graph.nodes)
    ? graph.nodes
    : typeof graph.nodes === "object"
      ? Object.values(graph.nodes)
      : [];

  for (const rawNode of nodes) {
    if (!rawNode || typeof rawNode !== "object") continue;
    const materialEid = getNodeMaterialTarget(rawNode as BehaviorGraphNode);
    if (materialEid !== undefined) {
      fn(materialEid);
    }
  }
}

function assignMaterialNetworkedDataIfNeeded(
  world: HubsWorld,
  matEid: EntityID,
  materialNid: NetworkID,
  creator: CreatorID,
  seenMaterials: Set<number>,
  seenTextures: Set<number>,
  textureState: { idx: number }
) {
  if (!matEid || !hasComponent(world, Networked, matEid) || seenMaterials.has(matEid)) return;

  seenMaterials.add(matEid);
  setInitialNetworkedDataIfUnset(matEid, materialNid, creator);

  const material = world.eid2mat.get(matEid) as any;
  if (!material) return;

  const resolvedMaterialNid = APP.getString(Networked.id[matEid])!;
  Object.values(material).forEach(value => {
    if (!(value instanceof Texture)) return;
    const textureValue = value as Texture & { eid?: EntityID };
    const texEid = textureValue.eid;
    if (!texEid || !hasComponent(world, Networked, texEid) || seenTextures.has(texEid)) return;

    seenTextures.add(texEid);
    setInitialNetworkedDataIfUnset(texEid, `${resolvedMaterialNid}.tex.${textureState.idx}`, resolvedMaterialNid);
    textureState.idx += 1;
  });
}

function assignNetworkedRenderAssetData(world: HubsWorld, rootEid: EntityID, rootNid: NetworkID, creator: CreatorID) {
  const rootObj = world.eid2obj.get(rootEid)!;
  const seenMaterials = new Set<number>();
  const seenTextures = new Set<number>();
  let materialIdx = 0;
  const textureState = { idx: 0 };

  rootObj.traverse(obj => {
    if (!obj.eid || !hasComponent(world, Networked, obj.eid) || !Networked.id[obj.eid]) return;

    const objectNid = APP.getString(Networked.id[obj.eid])!;

    forEachObjectMaterial(obj, mat => {
      const matEid = mat?.eid as EntityID | undefined;
      if (!matEid) return;
      assignMaterialNetworkedDataIfNeeded(
        world,
        matEid,
        `${objectNid}.mat.${materialIdx}`,
        creator,
        seenMaterials,
        seenTextures,
        textureState
      );
      materialIdx += 1;
    });
  });

  // Behavior Graphs can reference materials not mounted on any mesh at load time.
  // Ensure those networked materials/textures also receive deterministic NIDs.
  let bgMaterialIdx = 0;
  forEachBehaviorGraphMaterialEid(rootObj, matEid => {
    assignMaterialNetworkedDataIfNeeded(
      world,
      matEid,
      `${rootNid}.bgmat.${bgMaterialIdx}`,
      creator,
      seenMaterials,
      seenTextures,
      textureState
    );
    bgMaterialIdx += 1;
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
  assignNetworkedRenderAssetData(world, eid, rootNid, rootNid);
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
  assignNetworkedRenderAssetData(world, childEid, rootNid, rootNid);
}

export function setInitialNetworkedData(eid: EntityID, nid: NetworkID, creator: CreatorID) {
  Networked.id[eid] = APP.getSid(nid);
  APP.world.nid2eid.set(Networked.id[eid], eid);
  Networked.creator[eid] = APP.getSid(creator);
  Networked.owner[eid] = APP.getSid("reticulum");
  Networked.lastOwnerTime[eid] = 0;
}
