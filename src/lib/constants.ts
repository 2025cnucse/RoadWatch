import type { FacilityType, DamageSeverity, AcknowledgedStatus } from '@/types';

export const facilityTypes: { value: FacilityType; label: string }[] = [
  { value: "Bridge", label: "교량" },
  { value: "Road", label: "도로" },
  { value: "Sign", label: "표지판" },
  { value: "Traffic Light", label: "신호등" },
  { value: "Guardrail", label: "가드레일" },
  { value: "Other", label: "기타" },
];

export const damageSeverities: { value: DamageSeverity; label: string }[] = [
  { value: "Low", label: "낮음" },
  { value: "Medium", label: "중간" },
  { value: "High", label: "높음" },
];

export const acknowledgedStatusOptions: { value: AcknowledgedStatus; label: string }[] = [
  { value: "all", label: "모든 상태" },
  { value: "acknowledged", label: "확인됨" },
  { value: "unacknowledged", label: "미확인" },
];