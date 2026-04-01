export interface HelpCommand {
  cmd: string;
  desc: string;
  example?: string;
}

export interface HelpMessageOptions {
  /** Title shown at the top (default: "Commands"). */
  title?: string;
  /** Emoji prepended to the title (default: "📖"). */
  emoji?: string;
  commands: HelpCommand[];
  adminCommands?: HelpCommand[];
  isOwner: boolean;
  /** Title for the admin section (default: "Admin"). */
  adminTitle?: string;
  /** Emoji prepended to the admin title (default: "🔒"). */
  adminEmoji?: string;
}

/**
 * Builds a standard help message in Telegram HTML format.
 *
 * Follows the pattern shared across repos:
 * - emoji + bold title
 * - command list with descriptions and optional examples
 * - conditional admin section for owner
 */
export function buildHelpMessage(options: HelpMessageOptions): string {
  const {
    title = "Commands",
    emoji = "📖",
    commands,
    adminCommands,
    isOwner,
    adminTitle = "Admin",
    adminEmoji = "🔒",
  } = options;

  const lines: string[] = [`${emoji} <b>${title}</b>`, ""];

  for (const c of commands) {
    lines.push(`${c.cmd} — ${c.desc}`);
    if (c.example) {
      lines.push(`  <i>${c.example}</i>`);
    }
  }

  if (isOwner && adminCommands && adminCommands.length > 0) {
    lines.push("", `${adminEmoji} <b>${adminTitle}</b>`);
    for (const c of adminCommands) {
      lines.push(`${c.cmd} — ${c.desc}`);
      if (c.example) {
        lines.push(`  <i>${c.example}</i>`);
      }
    }
  }

  return lines.join("\n");
}
