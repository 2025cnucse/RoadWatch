import type { FacilityType, DamageSeverity, AcknowledgedStatus } from '@/types';

export const facilityTypes: FacilityType[] = ["Bridge", "Road", "Sign", "Traffic Light", "Guardrail", "Other"];
export const damageSeverities: DamageSeverity[] = ["Low", "Medium", "High"];

export const acknowledgedStatusOptions: { value: AcknowledgedStatus; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "unacknowledged", label: "Unacknowledged" },
];
