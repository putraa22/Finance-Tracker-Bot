export function installErrorHandler(bot) {
  bot.use(async (ctx, next) => {
    try {
      return await next();
    } catch (err) {
      console.error(err);
      return ctx.reply("❌ Terjadi error. Coba lagi ya.");
    }
  });
}
