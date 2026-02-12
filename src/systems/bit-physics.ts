import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, Not } from "bitecs";
import { Object3DTag, Rigidbody, PhysicsShape, AEntity, Holdable } from "../bit-components";
import { getShapeFromPhysicsShape } from "../inflators/physics-shape";
import { findAncestorWithComponent } from "../utils/bit-utils";
import { getBodyFromRigidBody, Type } from "../inflators/rigid-body";
import { HubsWorld } from "../app";
import { PhysicsSystem } from "./physics-system";
import { getBox } from "../utils/auto-box-collider";
import { Shape, Axis } from "../inflators/physics-shape";
import { Object3D, Vector3 } from "three";

const rigidbodyQuery = defineQuery([Rigidbody, Object3DTag, Not(AEntity)]);
const rigidbodyEnteredQuery = enterQuery(rigidbodyQuery);
const rigidbodyExitedQuery = exitQuery(rigidbodyQuery);
const shapeQuery = defineQuery([PhysicsShape]);
const shapeEnterQuery = enterQuery(shapeQuery);
const shapeExitQuery = exitQuery(shapeQuery);

const tmpSize = new Vector3();

function getAutoDynamicShape(world: HubsWorld, bodyEid: number, shapeEid: number, obj: Object3D, shape: any) {
  // Heuristic only for dynamic grabbables with default convex hull collision.
  if (!hasComponent(world, Holdable, bodyEid) || Rigidbody.type[bodyEid] !== Type.DYNAMIC) {
    return shape;
  }
  if (PhysicsShape.type[shapeEid] !== Shape.HULL) {
    return shape;
  }

  const box = getBox(obj, obj);
  if (box.isEmpty()) {
    return shape;
  }

  box.getSize(tmpSize);
  const x = Math.max(tmpSize.x, 0.001);
  const y = Math.max(tmpSize.y, 0.001);
  const z = Math.max(tmpSize.z, 0.001);
  const dims = [x, y, z].sort((a, b) => a - b);
  const shortest = dims[0];
  const middle = dims[1];
  const longest = dims[2];

  const isLongAndThin = longest / middle >= 2.5;
  const isRoughlyRoundCrossSection = middle / shortest <= 1.6;

  if (isLongAndThin && isRoughlyRoundCrossSection) {
    let axis = Axis.Y;
    let halfExtents: [number, number, number];
    if (x >= y && x >= z) {
      axis = Axis.X;
      const radius = Math.max((y + z) * 0.25, 0.02);
      halfExtents = [x * 0.5, radius, radius];
    } else if (z >= x && z >= y) {
      axis = Axis.Z;
      const radius = Math.max((x + y) * 0.25, 0.02);
      halfExtents = [radius, radius, z * 0.5];
    } else {
      axis = Axis.Y;
      const radius = Math.max((x + z) * 0.25, 0.02);
      halfExtents = [radius, y * 0.5, radius];
    }

    return {
      ...shape,
      type: "capsule",
      fit: "manual",
      cylinderAxis: axis === Axis.X ? "x" : axis === Axis.Z ? "z" : "y",
      halfExtents
    };
  }

  return {
    ...shape,
    type: "box",
    fit: "manual",
    halfExtents: [x * 0.5, y * 0.5, z * 0.5]
  };
}

function addPhysicsShapes(world: HubsWorld, physicsSystem: PhysicsSystem, eid: number) {
  const bodyId = PhysicsShape.bodyId[eid];
  const obj = world.eid2obj.get(eid)!;
  const bodyEid = findAncestorWithComponent(world, Rigidbody, eid);
  let shape = getShapeFromPhysicsShape(eid);
  if (bodyEid != null) {
    shape = getAutoDynamicShape(world, bodyEid, eid, obj, shape);
  }
  const shapeId = physicsSystem.addShapes(bodyId, obj, shape);
  PhysicsShape.shapeId[eid] = shapeId;
}

export const physicsCompatSystem = (world: HubsWorld, physicsSystem: PhysicsSystem) => {
  rigidbodyEnteredQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid);
    const body = getBodyFromRigidBody(eid);
    const bodyId = physicsSystem.addBody(obj, body);
    Rigidbody.bodyId[eid] = bodyId;
  });

  shapeEnterQuery(world).forEach(eid => {
    const bodyEid = findAncestorWithComponent(world, Rigidbody, eid);
    if (bodyEid != null) {
      PhysicsShape.bodyId[eid] = Rigidbody.bodyId[bodyEid];
      addPhysicsShapes(world, physicsSystem, eid);
    } else {
      console.warn(`Could find a body for shape in entity ${eid}`);
    }
  });

  shapeExitQuery(world).forEach(eid => physicsSystem.removeShapes(PhysicsShape.bodyId[eid], PhysicsShape.shapeId[eid]));

  rigidbodyExitedQuery(world).forEach(eid => {
    if (entityExists(world, eid) && hasComponent(world, PhysicsShape, eid)) {
      physicsSystem.removeShapes(PhysicsShape.bodyId[eid], PhysicsShape.shapeId[eid]);
      // The PhysicsShape is still on this entity!
    }
    physicsSystem.removeBody(Rigidbody.bodyId[eid]);
  });
};
