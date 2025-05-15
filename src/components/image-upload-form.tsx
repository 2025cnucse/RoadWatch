
'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadFormProps {
  onImageUpload: (file: File, isAugmented: boolean, imageDataUri: string) => void;
}

export function ImageUploadForm({ onImageUpload }: ImageUploadFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAugmented, setIsAugmented] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({
        title: "파일 오류",
        description: "업로드할 이미지를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    // The previewUrl is already a data URI if a file is selected
    if (previewUrl) {
      onImageUpload(selectedFile, isAugmented, previewUrl);
      // Reset form
      setSelectedFile(null);
      setIsAugmented(false);
      setPreviewUrl(null);
      event.currentTarget.reset(); // Reset file input more reliably
    } else {
        // Fallback if previewUrl somehow isn't set but file is (should not happen with current logic)
        const reader = new FileReader();
        reader.onloadend = () => {
            const imageDataUri = reader.result as string;
            onImageUpload(selectedFile, isAugmented, imageDataUri);
            setSelectedFile(null);
            setIsAugmented(false);
            setPreviewUrl(null);
            event.currentTarget.reset();
        };
        reader.onerror = () => {
            toast({
                title: "파일 읽기 오류",
                description: "파일을 읽는 중 오류가 발생했습니다.",
                variant: "destructive",
            });
        };
        reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <Card className="mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <UploadCloud className="mr-2 h-6 w-6 text-primary" />
          새로운 손상 보고서 업로드 (프로토타입)
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="imageFile" className="text-sm font-medium">이미지 파일 선택</Label>
            <Input
              id="imageFile"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1"
            />
            {previewUrl && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">미리보기:</Label>
                <div className="mt-1 relative w-full max-w-xs h-40 border rounded-md overflow-hidden">
                  <Image src={previewUrl} alt="선택된 이미지 미리보기" layout="fill" objectFit="contain" />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isAugmented"
              checked={isAugmented}
              onCheckedChange={(checked) => setIsAugmented(checked as boolean)}
            />
            <Label htmlFor="isAugmented" className="text-sm font-medium cursor-pointer">
              데이터 증강된 이미지입니다
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={!selectedFile}>
            <UploadCloud className="mr-2 h-4 w-4" />
            보고서 추가
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
