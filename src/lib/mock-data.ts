// import type { DamageReport, FacilityType, DamageSeverity } from '@/types';

// const facilityTypes: FacilityType[] = ["Bridge", "Road", "Sign", "Traffic Light", "Guardrail", "Other"];
// const damageSeverities: DamageSeverity[] = ["Low", "Medium", "High"];

// const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// export const mockDamageReports: DamageReport[] = Array.from({ length: 12 }, (_, i) => {
//   const facilityType = getRandomElement(facilityTypes);
//   const damageSeverity = getRandomElement(damageSeverities);
//   const id = `report-${i + 1}`;
//   return {
//     id,
//     facilityType,
//     damageSeverity,
//     imageUrl: `https://placehold.co/${600 + i * 10}x${400 + i * 5}.png`,
//     gcsUrl: `gs://roadwatch-bucket/${id}.jpg`, // Example GCS URL
//     timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30), // Random time in last 30 days
//     location: `Location ${String.fromCharCode(65 + i)}, Sector ${i % 3 + 1}`,
//     description: `Damage observed on ${facilityType.toLowerCase()} at location. Severity assessed as ${damageSeverity.toLowerCase()}. Issue requires attention. Example description text to fill space.`,
//     acknowledged: Math.random() > 0.7, // ~30% acknowledged
//     isAugmented: i % 2 === 0, // Roughly half of the reports are marked as augmented
//   };
// });

import type { DamageReport } from '@/types';

export const mockDamageReports: DamageReport[] = [
  {
    id: 'r001',
    facilityType: 'Road',
    damageSeverity: 'High',
    imageUrl: '/images/porthole1.jpg',
    timestamp: new Date('2024-06-01T10:30:00'),
    location: '대전시 유성구',
    description: '도로에 포트홀 발생',
    acknowledged: false,
    isAugmented: false,
  },
  {
    id: 'r002',
    facilityType: 'Road',
    damageSeverity: 'Medium',
    imageUrl: '/images/roadDamage1.png',
    timestamp: new Date('2024-06-02T14:15:00'),
    location: '대전시 유성구',
    description: '도로에 균열 발생',
    acknowledged: false,
    isAugmented: false,
  },
  {
    id: 'r003',
    facilityType: 'Road',
    damageSeverity: 'Low',
    imageUrl: '/images/porthole2.jpg',
    timestamp: new Date('2024-06-03T09:00:00'),
    location: '대전시 유성구',
    description: '도로에 포트홀 발생',
    acknowledged: false,
    isAugmented: false,
  },
  {
    id: 'r004',
    facilityType: 'Road',
    damageSeverity: 'High',
    imageUrl: '/images/snow.webp',
    timestamp: new Date('2024-06-04T16:45:00'),
    location: '대전시 유성구',
    description: '',
    acknowledged: false,
    isAugmented: true,  // 증강 데이터
  },
  {
    id: 'r005',
    facilityType: 'Sign',
    damageSeverity: 'High',
    imageUrl: '/images/strongRain1.jpg',
    timestamp: new Date('2024-06-05T11:20:00'),
    location: '대전시 유성구',
    description: '',
    acknowledged: false,
    isAugmented: true,  // 증강 데이터
  },
  {
    id: 'r006',
    facilityType: 'Traffic Light',
    damageSeverity: 'Medium',
    imageUrl: '/images/rain1.jpg',
    timestamp: new Date('2024-06-06T08:00:00'),
    location: '대전시 유성구',
    description: '',
    acknowledged: false,
    isAugmented: true,  // 증강 데이터
  },
];
