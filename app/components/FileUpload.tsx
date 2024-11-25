'use client';

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button.js";
import { Progress } from "@/components/ui/progress.js";
import { toast } from "@/hooks/use-toast.js";
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils.js';

interface FileUploadProps {
  onUpload: (content: string) => void;
  accept?: string;
}

export function FileUpload({ onUpload, accept = ".txt,.md,.js,.ts,.jsx,.tsx,.json,.py" }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setFileName(file.name);
      setProgress(0);
      
      const reader = new FileReader();
      
      reader.onprogress = (event) => {
        if (event.loaded && event.total) {
          const percent = (event.loaded / event.total) * 100;
          setProgress(percent);
        }
      };

      reader.onload = (e) => {
        const content = e.target?.result as string;
        onUpload(content);
        toast({
          title: "File uploaded",
          description: `${file.name} has been processed`
        });
        setProgress(100);
        setTimeout(() => {
          setFileName(undefined);
          setProgress(0);
        }, 2000);
      };

      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process file",
        variant: "destructive"
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer",
          isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25",
          fileName && "border-primary"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        
        {fileName ? (
          <div className="flex items-center justify-center gap-2">
            <File className="w-4 h-4" />
            <span className="text-sm">{fileName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="w-4 h-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setFileName(undefined);
                setProgress(0);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-muted-foreground/50" />
            <div className="text-sm text-muted-foreground">
              Drop a file here or click to select
            </div>
          </div>
        )}
      </div>
      
      {progress > 0 && (
        <Progress value={progress} className="mt-2" />
      )}
    </div>
  );
}