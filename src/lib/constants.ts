import type { FacilityType, DamageSeverity, AcknowledgedStatus } from '@/types';

export const facilityTypes: { value: FacilityType; label: string }[] = [
  // { value: "Bridge", label: "교량" },
  // { value: "Road", label: "도로" },
  // { value: "Sign", label: "표지판" },
  // { value: "Traffic Light", label: "신호등" },
  // { value: "Guardrail", label: "가드레일" },
  { value: "횡단보도", label: "횡단보도" },
  { value: "과속방지턱", label: "과속방지턱" },
  { value: "Other", label: "기타" },
];

export const damageSeverities: { value: DamageSeverity; label: string }[] = [
  { value: "Low", label: "낮음" },
  { value: "Medium", label: "중간" },
  { value: "High", label: "높음" },
];

export const acknowledgedStatusOptions: { value: AcknowledgedStatus; label: string }[] = [
  { value: "all", label: "모든 상태" },
  { value: "acknowledged", label: "정상으로 분류됨" },
  { value: "unacknowledged", label: "훼손으로 분류됨" },
];