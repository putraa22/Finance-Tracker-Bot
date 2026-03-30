export function replyMd(ctx, text) {
  return ctx.reply(text, { parse_mode: "Markdown" });
}
