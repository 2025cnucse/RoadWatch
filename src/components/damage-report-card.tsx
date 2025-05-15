'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { DamageReport, DamageSeverity } from '@/types';
import { FacilityIcon } from '@/components/icons';
import { CheckCircle2, AlertCircle, CalendarDays, MapPin, RotateCcw } from 'lucide-react'; // Added RotateCcw
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { damageSeverities } from '@/lib/constants';

interface DamageReportCardProps {
  report: DamageReport;
  onAcknowledge: (id: string) => void;
  onSeverityChange: (id: string, newSeverity: DamageSeverity) => void;
}

const getSeverityBadgeVariant = (severity: DamageSeverity): BadgeProps['variant'] => {
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

export function DamageReportCard({ report, onAcknowledge, onSeverityChange }: DamageReportCardProps) {
  return (
    <Card className={`flex flex-col h-full shadow-lg transition-all duration-300 hover:shadow-xl ${report.acknowledged ? 'bg-secondary/30' : 'bg-card'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <FacilityIcon type={report.facilityType} className="mr-2 h-5 w-5 text-primary" />
            {report.facilityType}
          </CardTitle>
          <Badge variant={getSeverityBadgeVariant(report.damageSeverity)}>{report.damageSeverity}</Badge>
        </div>
         <Dialog>
          <DialogTrigger asChild>
            <div className="relative w-full h-48 rounded-md overflow-hidden border cursor-pointer">
              <Image
                src={report.imageUrl}
                alt={`Damage at ${report.location} - ${report.facilityType}`}
                layout="fill"
                objectFit="cover"
                data-ai-hint={getAiHint(report.facilityType)}
              />
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[50vw] p-0">
            <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
              <DialogTitle>Image Detail - {report.facilityType} at {report.location}</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <div className="p-4 max-h-[80vh] overflow-auto">
              <Image
                src={report.imageUrl}
                alt={`Detailed view - Damage at ${report.location} - ${report.facilityType}`}
                width={1200}
                height={800}
                className="rounded-md object-contain w-full h-auto"
              />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 pt-4">
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
        
        <div className="space-y-1 pt-2">
          <Label htmlFor={`severity-select-${report.id}`} className="text-xs font-medium text-muted-foreground">
            Change Severity:
          </Label>
          <Select
            value={report.damageSeverity}
            onValueChange={(newSeverity) => onSeverityChange(report.id, newSeverity as DamageSeverity)}
            // Severity can now be changed even if acknowledged
            // disabled={report.acknowledged} 
          >
            <SelectTrigger id={`severity-select-${report.id}`} className="h-9">
              <SelectValue placeholder="Select severity" />
            </SelectTrigger>
            <SelectContent>
              {damageSeverities.map(severity => (
                <SelectItem key={severity} value={severity}>{severity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onAcknowledge(report.id)}
          variant={report.acknowledged ? "outline" : "default"}
          className="w-full"
        >
          {report.acknowledged ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4" /> Mark as Unacknowledged
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Acknowledged
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
