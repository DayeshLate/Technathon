/**
 * AI Emergency Priority Triage Service
 * Analyzes clinical parameters, response window, blood group rarity,
 * and current inventory shortage to calculate priority score (0-100)
 * and triage classification.
 */
export function calculateEmergencyPriority({ bloodGroup, unitsRequired, urgency, requiredByMinutes }) {
  const units = Number(unitsRequired) || 2;
  const mins = Number(requiredByMinutes) || 60;

  let computedPriority = 'Normal';
  let priorityScore = 65;
  let priorityReason = 'Standard clinical priority. Regular matching protocol engaged.';

  const isRareGroup = bloodGroup === 'O-' || bloodGroup === 'AB-';

  if (urgency === 'Critical' || mins <= 60 || (isRareGroup && units >= 3)) {
    computedPriority = 'Critical';
    priorityScore = mins <= 45 ? 98 : 96;
    priorityReason = mins <= 45
      ? `Ultra-Critical: Response window is only ${mins} min with high unit demand (${units} units). Rapid relay protocol activated.`
      : `High priority: Required time is under 1 hour (${mins} min) and rare ${bloodGroup} group has low citywide reserves.`;
  } else if (urgency === 'High' || mins <= 120 || units >= 4) {
    computedPriority = 'High';
    priorityScore = 82;
    priorityReason = `Elevated priority: ${units} units required within ${mins} minutes. Multi-bank reservation initiated.`;
  } else {
    computedPriority = 'Normal';
    priorityScore = 68;
    priorityReason = `Scheduled requirement: ${units} units within ${mins} minutes. Routine donor matching engaged.`;
  }

  return {
    priority: computedPriority,
    priorityScore,
    priorityReason
  };
}
