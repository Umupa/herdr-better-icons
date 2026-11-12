// Everything that touches files: owner avatars, imported images, programs.json.
// Downloads and copies go through curl (macOS, Linux and Windows 10+ have it).
// Files live in the mod's hidden .cache folder: saving there doesn't reload mods.

import { exec, appHome, readTextFile, writeTextFile, window } from "herdr";
import { MOD, IMAGE } from "./model.js";

const CACHE = `mods/${MOD}/.cache`;
const abs = (rel) => `${appHome()}/${rel}`;

async function curl(url, rel) {
  const r = await exec("curl", ["-fsSL", "--max-time", "20", "--create-dirs", "-o", abs(rel), url], { timeout: 30000 });
  return r.code === 0;
}

async function gitlabAvatar(name) {
  for (const kind of ["users?username=", "groups/"]) {
    try {
      const r = await fetch(`https://gitlab.com/api/v4/${kind}${encodeURIComponent(name)}`);
      if (!r.ok) continue;
      const body = await r.json();
      const url = (Array.isArray(body) ? body[0] : body)?.avatar_url;
      if (url) return url;
    } catch {}
  }
  return null;
}

// The owner's avatar, downloaded; resolves with its path in the app folder, or null.
export async function downloadAvatar(o) {
  const url = o.host === "github" ? `https://github.com/${o.name}.png?size=96` : await gitlabAvatar(o.name);
  if (!url) return null;
  const rel = `${CACHE}/avatars/${o.key}.png`;
  return (await curl(url, rel)) ? rel : null;
}

function hash(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.codePointAt(0), 16777619) >>> 0;
  return h.toString(16);
}

// Copies a picked or dropped image next to the mod; resolves with its path, or throws.
export async function importImage(path) {
  const ext = path.match(IMAGE)?.[1]?.toLowerCase();
  if (!ext) throw new Error("Choose a PNG, JPEG, GIF, WebP or SVG image.");
  const rel = `${CACHE}/images/${hash(`${path}\n${Date.now()}`)}.${ext === "jpeg" ? "jpg" : ext}`;
  const file = path.replace(/\\/g, "/");
  if (!(await curl(`file://${encodeURI(file.startsWith("/") ? file : `/${file}`)}`, rel))) throw new Error("Couldn't read that image.");
  return rel;
}

// The system's file picker; resolves with a path, or null when cancelled or unavailable.
export async function chooseImage() {
  const exts = ["png", "jpg", "jpeg", "gif", "webp", "svg"];
  const os = window().platform;
  const tries = os === "macos"
    ? [["osascript", ["-e", 'POSIX path of (choose file of type {"public.image"} with prompt "Space icon")']]]
    : os === "windows"
      ? [["powershell", ["-NoProfile", "-Command", `Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.OpenFileDialog; $d.Filter = 'Images|${exts.map((e) => `*.${e}`).join(";")}'; if ($d.ShowDialog() -eq 'OK') { $d.FileName }`]]]
      : [["zenity", ["--file-selection", "--title=Space icon", `--file-filter=Images | ${exts.map((e) => `*.${e}`).join(" ")}`]],
         ["kdialog", ["--getopenfilename", ".", exts.map((e) => `*.${e}`).join(" ")]]];
  for (const [program, args] of tries) {
    try {
      const r = await exec(program, args, { timeout: 600000 });
      return r.code === 0 ? r.stdout.trim() || null : null;
    } catch {} // Not installed: the next one, else drop an image instead.
  }
  return null;
}

// The agents' own marks (LobeHub, as Sheprd uses), in their brand colors where the
// brand has one, through programs.json. The SVGs carry a little room around the
// mark, so they sit smaller in the agents list. Only entries whose icon is unset
// or already ours are touched, so a person's own icons stay.
export const AGENTS = ["claude", "codex", "gemini", "cursor", "antigravity", "opencode", "copilot", "kimi", "kiro", "amp", "grok", "hermes", "mastracode", "qoder", "muse"];
// One-color marks (no brand color): drawn in the text color.
const MONO = new Set(["codex", "cursor", "opencode", "copilot", "grok", "hermes", "mastracode"]);

export async function useAgentIcons() {
  const path = abs("programs.json");
  const before = await readTextFile(path);
  let doc;
  try { doc = before ? JSON.parse(before) : {}; } catch { return false; } // Theirs to fix; Herdr reports it.
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return false;
  const programs = doc.programs && typeof doc.programs === "object" ? doc.programs : (doc.programs = {});
  let changed = false;
  for (const key of AGENTS) {
    const entry = programs[key] && typeof programs[key] === "object" ? programs[key] : {};
    const icon = `mods/${MOD}/agents/${key}.svg`;
    if (entry.icon !== undefined && !String(entry.icon).startsWith(`mods/${MOD}/`)) continue;
    const tint = MONO.has(key);
    if (entry.icon === icon && entry.tint === tint) continue;
    programs[key] = { ...entry, icon, tint };
    changed = true;
  }
  if (changed) await writeTextFile(path, `${JSON.stringify(doc, null, 2)}\n`, before);
  return changed;
}
