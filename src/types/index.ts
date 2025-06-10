export type FacilityType = "Bridge" | "Road" | "Sign" | "Traffic Light" | "Guardrail" | "Other";
export type DamageSeverity = "Low" | "Medium" | "High";
export type AcknowledgedStatus = "all" | "acknowledged" | "unacknowledged";

export interface DamageReport {
  id: string;
  facilityType: FacilityType;
  damageSeverity: DamageSeverity;
  imageUrl: string;
  gcsUrl?: string; // Optional: for AI processing if image is in GCS
  timestamp: Date;
  location: string;
  description: string;
  acknowledged: boolean;
  lat: number;
  lng: number;
  importance: string;
  isReviewed?: boolean;
}