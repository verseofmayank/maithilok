import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { email, passwordSchema } from '../lib/validation';
const rl = createInterface({ input: stdin, output: stdout });
const db = new PrismaClient();
try {
  const address = email.parse(process.env.ADMIN_EMAIL || (await rl.question('Admin email: ')));
  const password = passwordSchema.parse(
    process.env.ADMIN_PASSWORD ||
      (await rl.question('New password (12+ characters; input is visible locally): ')),
  );
  const existing = await db.user.findUnique({ where: { email: address } });
  if (existing) throw new Error('Account already exists. No account was changed.');
  await db.user.create({
    data: {
      name: 'Maithilok Admin',
      email: address,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'ADMIN',
    },
  });
  console.log('Admin created. Sign in at /admin/login.');
} finally {
  rl.close();
  await db.$disconnect();
}
