import { type WaitlistRepository } from "./repository.js"

export class InMemoryWaitlistRepository implements WaitlistRepository {
  readonly entries = new Map<string, { email: string; blocker?: string }>()

  async upsert(input: { email: string; blocker?: string }): Promise<void> {
    this.entries.set(input.email, input)
  }

  async remove(email: string): Promise<void> {
    this.entries.delete(email)
  }
}
