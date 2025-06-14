import type { DamageReport } from '@/types';

  export const mockDamageReports: DamageReport[] = [
    {
      id: 'r001',
      facilityType: 'Road',
      damageSeverity: 'High',
      imageUrl: '/images/0202_light_clear_traffic_10000768.png',
      timestamp: new Date('2024-06-01T10:30:00'),
      location: '대전시 유성구',
      description: '과속방지턱에서 심각한 훼손을 감지.',
      acknowledged: false,
      "lat": 36.3651,
      "lng": 127.3552,
      "importance": "middle",
      isReviewed: false
    },
    {
      id: 'r002',
      facilityType: 'Road',
      damageSeverity: 'Medium',
      imageUrl: '/images/0202_light_clear_traffic_10000786.png',
      timestamp: new Date('2024-06-02T14:15:00'),
      location: '대전시 유성구',
      description: '횡단보도에서 중간정도의 훼손을 감지',
      acknowledged: false,
      lat: 36.3627,
      lng: 127.3513,
      importance: "low",
      isReviewed: false
    },
    {
      id: 'r003',
      facilityType: 'Road',
      damageSeverity: 'Low',
      imageUrl: '/images/0202_light_clear_traffic_10000791.png',
      timestamp: new Date('2024-06-03T09:00:00'),
      location: '대전시 유성구',
      description: '횡단보도에서 경미한 훼손을 감지',
      acknowledged: false,
      lat: 36.3627,
      lng: 127.3510,
      importance: "low",
      isReviewed: false

    },
    {
      id: 'r004',
      facilityType: 'Road',
      damageSeverity: 'High',
      imageUrl: '/images/0202_light_clear_traffic_10000853.png',
      timestamp: new Date('2024-06-04T16:45:00'),
      location: '대전시 유성구',
      description: '횡단보도에서 심각한 훼손을 감지',
      acknowledged: false,
      lat: 36.3610,
      lng: 127.3531,
      importance: "low",
      isReviewed: false
    },
    {
      id: 'r005',
      facilityType: 'Sign',
      damageSeverity: 'Medium',
      imageUrl: '/images/0202_light_clear_traffic_10000795.png',
      timestamp: new Date('2024-06-05T11:20:00'),
      location: '대전시 유성구',
      description: '',
      acknowledged: false,
      lat: 36.3650,
      lng: 127.3531,
      importance: "low",
      isReviewed: false
    },
    // {
    //   id: 'r006',
    //   facilityType: 'Traffic Light',
    //   damageSeverity: 'Medium',
    //   imageUrl: '/images/rain1.jpg',
    //   timestamp: new Date('2024-06-06T08:00:00'),
    //   location: '대전시 유성구',
    //   description: '',
    //   acknowledged: false,
    //   lat: 36.3620,
    //   lng: 127.3531,
    //   importance: "low",
    //   isReviewed: false
    // },
  ];
