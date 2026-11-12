// better-icons: the spaces sidebar with quiet space icons, the agents' own marks,
// and the Icon… dialog. One mod, four roles by props.mode: the sidebar (none),
// "tabs" (the tab bar, a layout block with props { "mode": "tabs" }),
// "menu" (a space's right-click menu) and "picker" (the icon dialog).

import { props, nextCommand, focused, spaces } from "herdr";
import Sidebar from "./sidebar.js";
import Menu from "./menu.js";
import Picker from "./picker.js";
import TabBar from "./tabbar.js";
import { useAgentIcons } from "./files.js";

const ROLES = { tabs: TabBar, menu: Menu, picker: Picker };

export default class BetterIcons extends Sidebar {
  init(_props, cx) {
    // Each role is the copy's own view, not a child of it: Herdr redraws a mod's
    // root when live data changes (the layout, shared state), and a child would
    // keep showing what it saw first.
    const Role = ROLES[props()?.mode];
    if (Role) {
      Object.setPrototypeOf(this, Role.prototype);
      return Role.prototype.init.call(this, _props, cx);
    }
    super.init(_props, cx);
    cx.spawn(async () => { try { await useAgentIcons(); } catch {} });
    // keys.json: "...": "better-icons:icon" opens Icon… for the focused space.
    cx.spawn(async () => {
      for (;;) {
        const command = await nextCommand();
        const w = command === "icon" && spaces().find((s) => s.id === focused()?.space);
        if (w) this.picker(w);
      }
    });
  }
}
