import { prisma } from "../db.js";

export async function getUser(ctx) {
  const telegramId = String(ctx.from.id);

  let user = await prisma.user.findUnique({
    where: { telegramId },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        name: ctx.from.first_name,
      },
    });
  }

  return user;
}

export async function runWithUser(ctx, handler) {
  const user = await getUser(ctx);
  return handler(ctx, user);
}
