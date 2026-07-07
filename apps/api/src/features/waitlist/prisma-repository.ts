import { prisma } from "@plyco/db"

import { type WaitlistRepository } from "./repository.js"

export class PrismaWaitlistRepository implements WaitlistRepository {
  async upsert(input: { email: string; blocker?: string }): Promise<void> {
    await prisma.waitlistEntry.upsert({
      where: { email: input.email },
      create: {
        email: input.email,
        blocker: input.blocker ?? null,
      },
      update: {
        blocker: input.blocker ?? null,
      },
    })
  }

  async remove(email: string): Promise<void> {
    await prisma.waitlistEntry.deleteMany({ where: { email } })
  }
}
