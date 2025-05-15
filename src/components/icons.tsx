import type { FacilityType } from '@/types';
import { Building2, Road, Signpost, TrafficCone, ShieldAlert, HelpCircle, type LucideProps } from 'lucide-react';

interface FacilityIconProps extends LucideProps {
  type: FacilityType;
}

export function FacilityIcon({ type, ...props }: FacilityIconProps) {
  switch (type) {
    case 'Bridge':
      return <Building2 {...props} />;
    case 'Road':
      return <Road {...props} />;
    case 'Sign':
      return <Signpost {...props} />;
    case 'Traffic Light':
      return <TrafficCone {...props} />; // Using TrafficCone as a placeholder
    case 'Guardrail':
      return <ShieldAlert {...props} />;
    case 'Other':
    default:
      return <HelpCircle {...props} />;
  }
}
