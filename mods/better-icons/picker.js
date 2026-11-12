// The space icon dialog: Auto (the repository owner's avatar), None, a few
// glyphs, or an image of your own (choose or drop one). A pick applies at once.

import { View, div, svg, image } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { props, spaces, shared, setShared, closeOverlay, theme } from "herdr";
import { MOD, KEY, ICONS, COLORS, choice, colorOf } from "./model.js";
import { drawIcon } from "./icon.js";
import { importImage, chooseImage } from "./files.js";

const TILE = 36, GAP = 6, COLUMNS = 8;
export const PICKER_WIDTH = COLUMNS * TILE + (COLUMNS - 1) * GAP + 2 * 18 + 16;
export const PICKER_HEIGHT = 228;

export default class Picker extends View {
  init(_props, cx) {
    this.handle = cx.focus_handle();
    this.handle.focus();
    this.error = null;
    this.color = colorOf(this.stored);
  }

  get space() { return spaces().find((s) => s.id === props()?.space); }
  get stored() { return (shared(KEY) ?? {})[props()?.space] ?? null; }

  set(value) {
    const all = { ...(shared(KEY) ?? {}) };
    if (value) all[props().space] = value;
    else delete all[props().space];
    setShared(KEY, all);
    this.error = null;
  }

  useImage(path, cx) {
    if (!path) return;
    cx.spawn(async (cx) => {
      try { this.set({ kind: "image", path: await importImage(path) }); }
      catch (e) { this.error = String(e.message ?? e); }
      cx.notify();
    });
  }

  tile(id, tip, on, content, pick) {
    const t = theme();
    return h_flex().id(id).size(TILE).flex_none().items_center().justify_center().rounded(8)
      .border_1().border_color(on ? t.accent : "#00000000").bg(on ? t.selected : t.raised)
      .text_color(on ? t.foreground : t.muted).cursor_pointer().tooltip(tip)
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click((_e, cx) => { pick(cx); cx.notify(); })
      .child(content);
  }

  render() {
    const t = theme();
    const s = this.space;
    const stored = this.stored;
    const avatar = props()?.avatar ?? null;
    const kind = stored?.kind ?? "auto";
    const label = (text) => div().text_size(10.5).child(text);
    const tiles = [
      this.tile("bi-auto", avatar ? "The repository owner's avatar" : "The repository owner's avatar (none here)", kind === "auto",
        avatar ? image(avatar).size(22).rounded(5) : label("Auto"), () => this.set(null)),
      this.tile("bi-none", "No icon", kind === "none", label("None"), () => this.set({ kind: "none" })),
      ...ICONS.map((name) => this.tile(`bi-${name}`, name.replace(/-\d+$/, "").replace(/-/g, " "), kind === "icon" && stored.name === name,
        svg(`mods/${MOD}/icons/${name}.svg`).size(17).text_color(this.color), () => this.set({ kind: "icon", name, color: this.color }))),
      this.tile("bi-image", "Choose an image, or drop one here", kind === "image",
        kind === "image" ? image(stored.path).size(22).rounded(5) : svg(`mods/${MOD}/icons/image.svg`).size(17),
        (cx) => cx.spawn(async (cx) => { this.useImage(await chooseImage(), cx); })),
    ];
    return v_flex().id("bi-picker").track_focus(this.handle).size_full().p(18).gap(14).bg(t.popover).text_size(13).text_color(t.foreground)
      .on_key_down((e, cx) => { if (e.key === "escape") { closeOverlay(props()?.overlay); cx.stop_propagation(); } })
      .on_drop((e, cx) => { this.useImage(e.paths?.[0], cx); cx.notify(); })
      .child(h_flex().gap(10).items_center()
        .child(h_flex().size(24).flex_none().items_center().justify_center()
          .child(drawIcon(choice(stored, avatar), 20) ?? div()))
        .child(div().flex_1().min_w(0).truncate().font_semibold().child(s?.name ?? "Space"))
        .child(h_flex().id("bi-close").size(24).flex_none().items_center().justify_center().rounded(6)
          .text_color(t.muted).cursor_pointer().hover((st) => st.bg(t.hover).text_color(t.foreground))
          .on_click(() => closeOverlay(props()?.overlay))
          .child(svg(`mods/${MOD}/icons/x.svg`).size(14))))
      .child(h_flex().flex_wrap().gap(GAP).children(tiles))
      .child(h_flex().gap(10).items_center().children(COLORS.map((c, i) => div().id(`bi-color-${i}`).size(18).rounded(9).bg(c).cursor_pointer()
        .border_2().border_color(c === this.color ? t.foreground : t.popover)
        .on_click((_e, cx) => {
          this.color = c;
          if (stored?.kind === "icon") this.set({ ...stored, color: c });
          cx.notify();
        }))))
      .when(Boolean(this.error), (el) => el.child(div().text_size(11.5).text_color(t.blocked).child(this.error)));
  }
}
