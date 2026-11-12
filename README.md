# Better Icons for Herdr

Space icons and agent icons for the [Herdr](https://herdr.dev) desktop app. Each git repository in the spaces list shows its owner's avatar from GitHub or GitLab, agents show their own logos in brand colors, and you can give any space an icon and a color, or use your own image. It replaces the colored letter avatars (`CX`, `HA`) with something you can recognize at a glance.

![Herdr with Better Icons: repository avatars in the spaces list, colored agent logos](preview.png)

- **Repository avatars, automatically.** A space whose folder is a git repository shows the avatar of its owner on github.com or gitlab.com, taken from the `upstream` remote, else `origin`. That is the organization or user that owns it. Avatars download once and refresh weekly.
- **No icon when there's nothing to show.** A folder that isn't a repository, or has no GitHub or GitLab remote, shows no icon. Names stay aligned with the rows that have one.
- **Agent logos in color.** Claude Code, Codex, Gemini, Cursor, Antigravity, OpenCode, Copilot, Kimi, Kiro, Amp, Grok, Hermes, Mastra Code, Qoder and Muse use their own marks from [LobeHub icons](https://github.com/lobehub/lobe-icons). Marks with a brand color keep it (Claude's orange, Gemini's gradient); one-color marks follow your theme. They sit a little smaller than Herdr's defaults.
- **Your own icon, in a few clicks.** Click a space's icon, or right-click the space and choose **Icon…**. The dialog has one grid: Auto (the avatar), None, 21 icons, and your own image (choose one, or drop it on the dialog). Each icon comes in 8 colors. A pick applies at once.
- **Cleaner tab bar.** Files and Changes get new icons.
- **Everything else stays Herdr's.** The spaces list and the tab bar are Herdr's own (0.1.15) with only the icons changed: worktrees under their repo, branch and ahead/behind, machines, drag to reorder, the right-click menu.

![The Icon dialog: Auto, None, 21 icons, your own image, 8 colors](dialog.png)

## Install

Ask your agent inside Herdr: *"Add the mod at github.com/Umupa/herdr-better-icons"*. Or by hand:

```sh
git clone https://github.com/Umupa/herdr-better-icons.git
cp -R herdr-better-icons/mods/better-icons ~/.config/herdr-app/mods/
cp herdr-better-icons/layouts/main-better-icons.json ~/.config/herdr-app/layouts/
herdr-app do layout.switch --name main-better-icons
```

`main-better-icons` is Herdr's own `main` layout with the spaces list and the tab bar swapped for this mod's. `ctrl-shift-l` switches back to any other layout.

### Your own layout

Point the spaces block and the tab bar block at this mod:

```json
{ "id": "spaces", "type": "block", "content": { "mod": "better-icons" } }
{ "id": "tabs", "type": "block", "content": { "mod": "better-icons", "props": { "mode": "tabs" } } }
```

Optional key for the dialog, in `~/.config/herdr-app/keys.json`: `"cmd-shift-i": "better-icons:icon"`.

## What it touches

- **Network:** GitHub avatars (`github.com/<owner>.png`) and GitLab's public API for GitLab owners, through `curl`. Nothing else.
- **Programs it runs:** `git` (to read a space's remote), `curl` (downloads, and copying an image you pick), and the system file picker (`osascript` on macOS, `zenity` or `kdialog` on Linux, PowerShell on Windows).
- **Files outside its folder:** it adds `icon` and `tint` to those 15 agents in `~/.config/herdr-app/programs.json`. An agent you've already given your own icon is left alone. To undo it, delete those entries. Downloaded avatars and your images live in `mods/better-icons/.cache/`.

## Uninstall

Switch to another layout, then delete `mods/better-icons/`, `layouts/main-better-icons.json` and the `mods/better-icons/...` entries in `programs.json`.

## Credits

Spaces list and tab bar adapted from [herdr-app](https://github.com/herdrdev/herdr-app) (Apache-2.0). Agent marks: [LobeHub icons](https://github.com/lobehub/lobe-icons) (MIT). Glyphs: [Lucide](https://lucide.dev) (ISC). Changes icon: [GitHub Octicons](https://github.com/primer/octicons) (MIT). Brand marks belong to their owners. See [NOTICE](NOTICE).
