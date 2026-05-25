let triggerSequence = 0;

export function createInterventionTriggeredAt(): number {
  triggerSequence += 1;
  return Date.now() + triggerSequence;
}
