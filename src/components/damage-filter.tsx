'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FacilityType, DamageSeverity, AcknowledgedStatus } from '@/types';
import { facilityTypes, damageSeverities, acknowledgedStatusOptions } from '@/lib/constants';
import { FilterIcon, RotateCcwIcon } from 'lucide-react';

interface DamageFilterProps {
  onFilter: (facilityType: FacilityType | 'all', damageSeverity: DamageSeverity | 'all', acknowledgedStatus: AcknowledgedStatus) => void;
  onReset: () => void;
  isLoading: boolean;
}

export function DamageFilter({ onFilter, onReset, isLoading }: DamageFilterProps) {
  const [facilityType, setFacilityType] = useState<FacilityType | 'all'>('all');
  const [damageSeverity, setDamageSeverity] = useState<DamageSeverity | 'all'>('all');
  const [acknowledgedStatus, setAcknowledgedStatus] = useState<AcknowledgedStatus>('all');

  const handleFilter = () => {
    onFilter(facilityType, damageSeverity, acknowledgedStatus);
  };

  const handleReset = () => {
    setFacilityType('all');
    setDamageSeverity('all');
    setAcknowledgedStatus('all');
    onReset();
  }

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <FilterIcon className="mr-2 h-6 w-6 text-primary" />
          Filter Damage Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div>
            <Label htmlFor="facilityType" className="text-sm font-medium">Facility Type</Label>
            <Select value={facilityType} onValueChange={(value) => setFacilityType(value as FacilityType | 'all')}>
              <SelectTrigger id="facilityType" className="mt-1">
                <SelectValue placeholder="Select facility type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {facilityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="damageSeverity" className="text-sm font-medium">Damage Severity</Label>
            <Select value={damageSeverity} onValueChange={(value) => setDamageSeverity(value as DamageSeverity | 'all')}>
              <SelectTrigger id="damageSeverity" className="mt-1">
                <SelectValue placeholder="Select damage severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {damageSeverities.map(severity => (
                  <SelectItem key={severity} value={severity}>{severity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="acknowledgedStatus" className="text-sm font-medium">Acknowledged Status</Label>
            <Select value={acknowledgedStatus} onValueChange={(value) => setAcknowledgedStatus(value as AcknowledgedStatus)}>
              <SelectTrigger id="acknowledgedStatus" className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {acknowledgedStatusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleFilter} disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? 'Filtering...' : 'Apply Filters'}
            </Button>
            <Button onClick={handleReset} variant="outline" className="w-full md:w-auto" title="Reset Filters">
              <RotateCcwIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
