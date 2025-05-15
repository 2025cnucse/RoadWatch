import type { DamageReport, FacilityType, DamageSeverity } from '@/types';

const facilityTypes: FacilityType[] = ["Bridge", "Road", "Sign", "Traffic Light", "Guardrail", "Other"];
const damageSeverities: DamageSeverity[] = ["Low", "Medium", "High"];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const mockDamageReports: DamageReport[] = Array.from({ length: 12 }, (_, i) => {
  const facilityType = getRandomElement(facilityTypes);
  const damageSeverity = getRandomElement(damageSeverities);
  const id = `report-${i + 1}`;
  return {
    id,
    facilityType,
    damageSeverity,
    imageUrl: `https://placehold.co/${600 + i * 10}x${400 + i * 5}.png`,
    gcsUrl: `gs://roadwatch-bucket/${id}.jpg`, // Example GCS URL
    timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30), // Random time in last 30 days
    location: `Location ${String.fromCharCode(65 + i)}, Sector ${i % 3 + 1}`,
    description: `Damage observed on ${facilityType.toLowerCase()} at location. Severity assessed as ${damageSeverity.toLowerCase()}. Issue requires attention. Example description text to fill space.`,
    acknowledged: Math.random() > 0.7, // ~30% acknowledged
    isAugmented: i % 2 === 0, // Roughly half of the reports are marked as augmented
  };
});
