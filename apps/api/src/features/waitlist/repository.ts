export interface WaitlistRepository {
  upsert(input: { email: string; blocker?: string }): Promise<void>
  remove(email: string): Promise<void>
}
