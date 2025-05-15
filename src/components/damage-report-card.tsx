'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DamageReport, DamageSeverity } from '@/types';
import { FacilityIcon } from '@/components/icons';
import { CheckCircle2, AlertCircle, CalendarDays, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface DamageReportCardProps {
  report: DamageReport;
  onAcknowledge: (id: string) => void;
}

const getSeverityBadgeVariant = (severity: DamageSeverity): VariantProps<typeof Badge>['variant'] => {
  switch (severity) {
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'warning';
    case 'Low':
      return 'success';
    default:
      return 'secondary';
  }
};

const getAiHint = (facilityType: DamageReport['facilityType']): string => {
  switch (facilityType) {
    case 'Bridge': return "bridge architecture";
    case 'Road': return "road highway";
    case 'Sign': return "signpost street";
    case 'Traffic Light': return "traffic light";
    case 'Guardrail': return "guardrail highway";
    default: return "infrastructure damage";
  }
}

export function DamageReportCard({ report, onAcknowledge }: DamageReportCardProps) {
  return (
    <Card className={`flex flex-col h-full shadow-lg transition-all duration-300 hover:shadow-xl ${report.acknowledged ? 'opacity-70 bg-secondary/30' : 'bg-card'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <FacilityIcon type={report.facilityType} className="mr-2 h-5 w-5 text-primary" />
            {report.facilityType}
          </CardTitle>
          <Badge variant={getSeverityBadgeVariant(report.damageSeverity)}>{report.damageSeverity}</Badge>
        </div>
         <div className="relative w-full h-48 rounded-md overflow-hidden border">
            <Image
              src={report.imageUrl}
              alt={`Damage at ${report.location} - ${report.facilityType}`}
              layout="fill"
              objectFit="cover"
              data-ai-hint={getAiHint(report.facilityType)}
            />
          </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 pt-0">
        <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center">
                <MapPin className="mr-2 h-3.5 w-3.5" />
                <span>{report.location}</span>
            </div>
            <div className="flex items-center">
                <CalendarDays className="mr-2 h-3.5 w-3.5" />
                <span>{format(new Date(report.timestamp), 'MMM d, yyyy HH:mm')}</span>
            </div>
        </div>
        <CardDescription className="text-sm leading-relaxed line-clamp-3">
          {report.description}
        </CardDescription>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onAcknowledge(report.id)}
          disabled={report.acknowledged}
          variant={report.acknowledged ? "outline" : "default"}
          className="w-full"
        >
          {report.acknowledged ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Acknowledged
            </>
          ) : (
            <>
              <AlertCircle className="mr-2 h-4 w-4" /> Acknowledge
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
