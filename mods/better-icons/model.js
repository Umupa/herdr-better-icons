// What a space's icon is, and where a repository's owner avatar comes from.
// No app calls here: the sidebar, the picker and the tests share it.

export const MOD = "better-icons";
export const KEY = `${MOD}.spaces`; // shared: space id -> { kind: "none" | "icon" | "image", name?, path? }
export const AVATARS = `${MOD}.avatars`; // shared: owner key -> { path, at }
export const ICONS = ["folder", "code", "terminal", "globe", "server", "database", "bot", "sparkles", "smartphone", "cloud", "package", "book-open", "flask-conical", "rocket", "gamepad-2", "wrench", "layers", "heart", "star", "leaf", "coffee"];
// Glyph colors: the first is the default.
export const COLORS = ["#8b7cf6", "#5b8def", "#22b8cf", "#3fae6a", "#e3a73f", "#e3814f", "#e5604d", "#d9649a"];
const hex = (c) => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
export const colorOf = (stored) => (hex(stored?.color) ? stored.color : COLORS[0]);
export const IMAGE = /\.(png|jpe?g|gif|webp|svg|ico|bmp)$/i;
// An owner's avatar is looked for again after a week.
export const AVATAR_AGE = 7 * 24 * 3600 * 1000;

// `git@github.com:owner/repo.git`, `https://github.com/owner/repo`, `ssh://git@host:22/owner/repo`.
export function owner(url) {
  const text = String(url ?? "").trim();
  const m = text.match(/^(?:[a-z+]+:\/\/)?(?:[^@/]+@)?([^/:]+)(?::\d+)?[:/]+([^/]+)\/.+$/i);
  if (!m) return null;
  const host = m[1].toLowerCase(), name = m[2];
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return null;
  if (host === "github.com" || host === "ssh.github.com") return { host: "github", name, key: `github-${name.toLowerCase()}` };
  if (host === "gitlab.com") return { host: "gitlab", name, key: `gitlab-${name.toLowerCase()}` };
  return null;
}

// `git config --get-regexp` output: upstream (the project a fork came from) wins over origin.
export function remoteUrl(text) {
  const urls = {};
  for (const line of String(text ?? "").split("\n")) {
    const m = line.match(/^remote\.([^.]+)\.url\s+(.+)$/);
    if (m) urls[m[1]] = m[2].trim();
  }
  return urls.upstream ?? urls.origin ?? null;
}

// What to draw for a space: { kind: "avatar" | "icon" | "image", path?, name? } or null (nothing).
export function choice(stored, avatar) {
  if (stored?.kind === "none") return null;
  if (stored?.kind === "icon" && ICONS.includes(stored.name)) return { kind: "icon", name: stored.name, color: colorOf(stored) };
  if (stored?.kind === "image" && typeof stored.path === "string" && stored.path.startsWith(`mods/${MOD}/`)) return { kind: "image", path: stored.path };
  return avatar ? { kind: "avatar", path: avatar } : null;
}
