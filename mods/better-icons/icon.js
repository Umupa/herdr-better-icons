import { div, svg, image } from "gpui-kit";
import { h_flex } from "gpui-base";
import { MOD } from "./model.js";

// One space icon at `size`, or null: a glyph in its color, or a picture.
export function drawIcon(c, size) {
  if (!c) return null;
  const box = h_flex().size(size).flex_none().items_center().justify_center();
  if (c.kind === "icon") return box.child(svg(`mods/${MOD}/icons/${c.name}.svg`).size(size).text_color(c.color));
  return box.rounded(Math.max(3, Math.round(size * 0.24))).overflow_hidden().child(image(c.path).size(size));
}

// The slot an icon sits in, so names line up whether a row has one or not.
export const slot = (size) => div().size(size).flex_none();
