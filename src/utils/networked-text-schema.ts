import { NetworkedText } from "../bit-components";
import { defineNetworkSchema } from "./define-network-schema";
import { deserializerWithMigrations, Migration, NetworkSchema, read, StoredComponent, write } from "./network-schemas";
import type { EntityID } from "./networking-types";

const runtimeSerde = defineNetworkSchema(NetworkedText);

const migrations = new Map<number, Migration>();

function apply(eid: EntityID, { version, data }: StoredComponent) {
  if (version !== 1) return false;

  const {
    text,
    fontSize,
    textAlign,
    anchorX,
    anchorY,
    color,
    letterSpacing,
    lineHeight,
    outlineWidth,
    outlineColor,
    outlineBlur,
    outlineOffsetX,
    outlineOffsetY,
    outlineOpacity,
    fillOpacity,
    strokeWidth,
    strokeColor,
    strokeOpacity,
    textIndent,
    whiteSpace,
    overflowWrap,
    opacity,
    side,
    maxWidth,
    curveRadius,
    direction
  }: {
    text: string;
    fontSize: number;
    textAlign: number;
    anchorX: number;
    anchorY: number;
    color: number;
    letterSpacing: number;
    lineHeight: string;
    outlineWidth: string;
    outlineColor: number;
    outlineBlur: string;
    outlineOffsetX: string;
    outlineOffsetY: string;
    outlineOpacity: number;
    fillOpacity: number;
    strokeWidth: string;
    strokeColor: number;
    strokeOpacity: number;
    textIndent: number;
    whiteSpace: number;
    overflowWrap: number;
    opacity: number;
    side: number;
    maxWidth: number;
    curveRadius: number;
    direction: number;
  } = data;

  write(NetworkedText.text, eid, APP.getSid(text));
  write(NetworkedText.fontSize, eid, fontSize);
  write(NetworkedText.textAlign, eid, textAlign);
  write(NetworkedText.anchorX, eid, anchorX);
  write(NetworkedText.anchorY, eid, anchorY);
  write(NetworkedText.color, eid, color);
  write(NetworkedText.letterSpacing, eid, letterSpacing);
  write(NetworkedText.lineHeight, eid, APP.getSid(lineHeight));
  write(NetworkedText.outlineWidth, eid, APP.getSid(outlineWidth));
  write(NetworkedText.outlineColor, eid, outlineColor);
  write(NetworkedText.outlineBlur, eid, APP.getSid(outlineBlur));
  write(NetworkedText.outlineOffsetX, eid, APP.getSid(outlineOffsetX));
  write(NetworkedText.outlineOffsetY, eid, APP.getSid(outlineOffsetY));
  write(NetworkedText.outlineOpacity, eid, outlineOpacity);
  write(NetworkedText.fillOpacity, eid, fillOpacity);
  write(NetworkedText.strokeWidth, eid, APP.getSid(strokeWidth));
  write(NetworkedText.strokeColor, eid, strokeColor);
  write(NetworkedText.strokeOpacity, eid, strokeOpacity);
  write(NetworkedText.textIndent, eid, textIndent);
  write(NetworkedText.whiteSpace, eid, whiteSpace);
  write(NetworkedText.overflowWrap, eid, overflowWrap);
  write(NetworkedText.opacity, eid, opacity);
  write(NetworkedText.side, eid, side);
  write(NetworkedText.maxWidth, eid, maxWidth);
  write(NetworkedText.curveRadius, eid, curveRadius);
  write(NetworkedText.direction, eid, direction);
  return true;
}

export const NetworkedTextSchema: NetworkSchema = {
  componentName: "networked-text",
  serialize: runtimeSerde.serialize,
  deserialize: runtimeSerde.deserialize,
  serializeForStorage: function serializeForStorage(eid: EntityID) {
    return {
      version: 1,
      data: {
        text: APP.getString(read(NetworkedText.text, eid)),
        fontSize: read(NetworkedText.fontSize, eid),
        textAlign: read(NetworkedText.textAlign, eid),
        anchorX: read(NetworkedText.anchorX, eid),
        anchorY: read(NetworkedText.anchorY, eid),
        color: read(NetworkedText.color, eid),
        letterSpacing: read(NetworkedText.letterSpacing, eid),
        lineHeight: APP.getString(read(NetworkedText.lineHeight, eid)),
        outlineWidth: APP.getString(read(NetworkedText.outlineWidth, eid)),
        outlineColor: read(NetworkedText.outlineColor, eid),
        outlineBlur: APP.getString(read(NetworkedText.outlineBlur, eid)),
        outlineOffsetX: APP.getString(read(NetworkedText.outlineOffsetX, eid)),
        outlineOffsetY: APP.getString(read(NetworkedText.outlineOffsetY, eid)),
        outlineOpacity: read(NetworkedText.outlineOpacity, eid),
        fillOpacity: read(NetworkedText.fillOpacity, eid),
        strokeWidth: APP.getString(read(NetworkedText.strokeWidth, eid)),
        strokeColor: read(NetworkedText.strokeColor, eid),
        strokeOpacity: read(NetworkedText.strokeOpacity, eid),
        textIndent: read(NetworkedText.textIndent, eid),
        whiteSpace: read(NetworkedText.whiteSpace, eid),
        overflowWrap: read(NetworkedText.overflowWrap, eid),
        opacity: read(NetworkedText.opacity, eid),
        side: read(NetworkedText.side, eid),
        maxWidth: read(NetworkedText.maxWidth, eid),
        curveRadius: read(NetworkedText.curveRadius, eid),
        direction: read(NetworkedText.direction, eid)
      }
    };
  },
  deserializeFromStorage: deserializerWithMigrations(migrations, apply)
};
