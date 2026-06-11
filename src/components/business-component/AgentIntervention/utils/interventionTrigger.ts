let triggerSequence = 0;

export function createInterventionTriggeredAt(): number {
  return Date.now() + (triggerSequence += 1);
}
