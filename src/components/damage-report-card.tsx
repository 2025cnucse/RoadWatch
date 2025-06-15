  'use client';

  import Image from 'next/image';
  import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { Badge, type BadgeProps } from '@/components/ui/badge';
  import type { DamageReport, DamageSeverity, FacilityType as FacilityTypeValue } from '@/types';
  import { FacilityIcon } from '@/components/icons';
  import { CheckCircle2, AlertCircle, CalendarDays, MapPin, RotateCcw } from 'lucide-react';
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
  import { damageSeverities, facilityTypes } from '@/lib/constants'; // facilityTypes 추가

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

  const getFacilityTypeLabel = (value: FacilityTypeValue): string => {
    const facility = facilityTypes.find(f => f.value === value);
    return facility ? facility.label : value;
  }

  const getDamageSeverityLabel = (value: DamageSeverity): string => {
    const severity = damageSeverities.find(s => s.value === value);
    return severity ? severity.label : value;
  }

  export function DamageReportCard({ report, onAcknowledge, onSeverityChange }: DamageReportCardProps) {
    const facilityTypeLabel = getFacilityTypeLabel(report.facilityType);
    const damageSeverityLabel = getDamageSeverityLabel(report.damageSeverity);

    return (
      <Card className={`flex flex-col h-full shadow-lg transition-all duration-300 hover:shadow-xl ${report.acknowledged ? 'bg-secondary/30' : 'bg-card'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-lg font-semibold flex items-center">
              <FacilityIcon type={report.facilityType} className="mr-2 h-5 w-5 text-primary" />
              {facilityTypeLabel}
            </CardTitle>
            <Badge variant={getSeverityBadgeVariant(report.damageSeverity)}>{damageSeverityLabel}</Badge>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative w-full h-48 rounded-md overflow-hidden border cursor-pointer">
                <Image
                  src={report.imageUrl}
                  alt={`손상 위치 ${report.location} - ${facilityTypeLabel}`}
                  layout="fill"
                  objectFit="cover"
                  data-ai-hint={getAiHint(report.facilityType)}
                />
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[50vw] p-0">
              <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
                <DialogTitle>이미지 상세 - {facilityTypeLabel} (위치: {report.location})</DialogTitle>
                <DialogClose />
              </DialogHeader>
              <div className="p-4 max-h-[80vh] overflow-auto">
                <Image
                  src={report.imageUrl}
                  alt={`상세 보기 - 손상 위치 ${report.location} - ${facilityTypeLabel}`}
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
                  <span>{format(new Date(report.timestamp), 'yyyy년 MM월 dd일 HH:mm')}</span>
              </div>
              {/* ▼▼▼ 2. 여기에 신뢰도 표시를 추가합니다. ▼▼▼ */}
              {report.confidence !== undefined && (
                <div className="flex items-center font-medium text-amber-600">
                  <AlertCircle className="mr-2 h-3.5 w-3.5" />
                  <span>탐지 신뢰도: {report.confidence}%</span>
                </div>
            )}
            {/* ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ */}
          </div>
          <CardDescription className="text-sm leading-relaxed line-clamp-3">
            {report.description}
          </CardDescription>
          
          <div className="space-y-1 pt-2">
            <Label htmlFor={`severity-select-${report.id}`} className="text-xs font-medium text-muted-foreground">
              손상 정도 변경:
            </Label>
            <Select
              value={report.damageSeverity}
              onValueChange={(newSeverity) => onSeverityChange(report.id, newSeverity as DamageSeverity)}
            >
              <SelectTrigger id={`severity-select-${report.id}`} className="h-9">
                <SelectValue placeholder="손상 정도 선택" />
              </SelectTrigger>
              <SelectContent>
                {damageSeverities.map(severity => (
                  <SelectItem key={severity.value} value={severity.value}>{severity.label}</SelectItem>
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
                <RotateCcw className="mr-2 h-4 w-4" /> 훼손 상태로 분류하기
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> 정상으로 분류하기
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }
