export interface WaitlistRepository {
  upsert(input: { email: string; blocker?: string }): Promise<void>
}
