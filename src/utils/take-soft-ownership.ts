import { addComponent, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { AEntity, Networked, Owned } from "../bit-components";
import type { EntityID } from "./networking-types";

function isValidEntityId(eid: EntityID | undefined): eid is EntityID {
  return typeof eid === "number" && Number.isFinite(eid);
}

export function takeSoftOwnership(world: HubsWorld, eid: EntityID) {
  if (!isValidEntityId(eid)) {
    console.warn("takeSoftOwnership called with invalid entity id:", eid);
    return;
  }

  if (hasComponent(world, AEntity, eid)) {
    throw new Error("Cannot take soft ownership of AEntities.");
  }

  addComponent(world, Owned, eid);
  Networked.lastOwnerTime[eid] = Networked.timestamp[eid] + 1;
  Networked.owner[eid] = APP.getSid(NAF.clientId);
}
