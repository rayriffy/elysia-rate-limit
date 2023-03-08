export const getNextResetTime = (duration: number): Date => {
  const now = new Date()
  now.setMilliseconds(now.getMilliseconds() + duration)

  return now
}
