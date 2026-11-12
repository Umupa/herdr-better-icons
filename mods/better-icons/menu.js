// The space's right-click menu: Herdr's items (from the shipped `menu` mod) plus Icon….
// ↑/↓ move, Enter runs, Esc closes.

import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { run, props, closeOverlay, openOverlay, theme, keys, spaces, panes, exec } from "herdr";
import { MOD } from "./model.js";

function place(s) {
  const tabs = new Set((s.tabs ?? []).map((c) => c.id));
  return panes().find((p) => tabs.has(p.tab) && p.cwd)?.cwd || s.folder;
}

// A space's checkout: "main" (a repo's own), "linked" (a worktree), or null.
async function checkout(folder, on) {
  const top = await exec("git", ["rev-parse", "--show-toplevel"], { cwd: folder, on });
  const common = await exec("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: folder, on });
  if (top.code !== 0 || common.code !== 0) return null;
  return common.stdout.trim() === `${top.stdout.trim()}/.git` ? "main" : "linked";
}

function items(id, git) {
  return [
    ["Rename", "space.rename", { id }, "square-pen"],
    ["Icon…", "icon", { id }, "image"],
    ...(git ? [["New worktree", "worktree", { space: id, action: "new" }, "git-branch"], ["Open worktree", "worktree", { space: id, action: "open" }, "git-branch"]] : []),
    ...(git === "linked" ? [["Remove worktree", "worktree", { space: id, action: "remove" }, "git-branch"]] : []),
    ["Close", "space.close", { id }, "x"],
  ];
}

function shortcut(name) {
  return keys().find((b) => b.section === "global" && b.action === name)?.keys ?? "";
}

export default class Menu extends View {
  init(_props, cx) {
    this.at = 0;
    this.git = null;
    this.handle = cx.focus_handle();
    this.handle.focus();
    const space = spaces().find((s) => s.id === props()?.space);
    const folder = space && place(space);
    if (folder) cx.spawn(async (cx) => {
      this.git = await checkout(folder, space.machine).catch(() => null);
      cx.notify();
    });
  }

  choose(i) {
    const it = items(props()?.space, this.git)[i];
    if (!it) return;
    closeOverlay(props()?.overlay);
    if (it[1] === "icon") openOverlay({ mod: MOD, kind: "dialog", width: props().pickerWidth, height: props().pickerHeight, props: { mode: "picker", space: it[2].id, avatar: props().avatar ?? null } });
    else if (it[1] === "worktree") openOverlay({ mod: "worktree", kind: "dialog", ...(it[2].action === "open" ? { width: 560, height: 480 } : { width: 440, height: 260 }), props: it[2] });
    else run(it[1], it[2]);
  }

  render() {
    const t = theme();
    const list = items(props()?.space, this.git);
    return v_flex().id("menu").track_focus(this.handle).w_full().min_h(0).p(5).bg(t.popover).text_size(12.8)
      .on_key_down((e, cx) => {
        if (e.key === "down") this.at = (this.at + 1) % list.length;
        else if (e.key === "up") this.at = (this.at + list.length - 1) % list.length;
        else if (e.key === "enter") this.choose(this.at);
        else if (e.key === "escape") closeOverlay(props().overlay);
        else return;
        cx.notify();
      })
      .children(list.map((it, i) => v_flex()
        .when(it[1] === "space.close", (el) => el.child(div().mx(7).my(4).h(1).bg(t.border)))
        .child(h_flex().id(`mi-${i}`).h(31).px(8).gap(9).rounded(7).items_center().text_color(t.foreground)
          .when(i === this.at, (el) => el.bg(t.selected))
          .hover((s) => s.bg(t.hover))
          .on_click(() => this.choose(i))
          .child(svg(it[3] === "image" ? `mods/${MOD}/icons/image.svg` : `mods/workspace-chrome/${it[3]}.svg`).size(14).flex_none().text_color(t.muted))
          .child(div().flex_1().child(it[0]))
          .child(div().text_size(11).text_color(t.dim).child(it[1].startsWith("space.") ? shortcut(it[1]) : "")))));
  }
}
