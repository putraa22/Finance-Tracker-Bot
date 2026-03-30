export function replyMd(ctx, text) {
  return ctx.reply(text, { parse_mode: "Markdown" });
}

// Escape text so it doesn't break Telegram Markdown V1 rendering.
// Used for user-provided values like name/note.
export function escapeMarkdown(text) {
  let s = String(text ?? "");
  // Telegram MarkdownV1 special chars.
  // Using split/join avoids tricky escaping and works well for short user strings.
  const specials = [
    "\\",
    "_",
    "*",
    "[",
    "]",
    "(",
    ")",
    "~",
    "`",
    ">",
    "#",
    "+",
    "-",
    "=",
    "|",
    "{",
    "}",
    ".",
    "!",
  ];

  for (const ch of specials) {
    s = s.split(ch).join(`\\${ch}`);
  }

  return s;
}
