// app/components/ModelSelector.tsx
'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.js";
import { Badge } from "@/components/ui/badge.js";
import { ModelType } from '@/app/types/index.js';

interface ModelSelectorProps {
  value: ModelType;
  onChange: (model: ModelType) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={(value) => onChange(value as ModelType)}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="gpt-4o">
          <div className="flex items-center justify-between">
            <span>GPT-4o</span>
            <Badge variant="destructive" className="ml-2">Experimental</Badge>
          </div>
        </SelectItem>
        <SelectItem value="gpt-4">
          <div className="flex items-center justify-between">
            <span>GPT-4</span>
            <Badge className="ml-2">Stable</Badge>
          </div>
        </SelectItem>
        <SelectItem value="gpt-3.5-turbo">
          <div className="flex items-center justify-between">
            <span>GPT-3.5 Turbo</span>
            <Badge variant="secondary" className="ml-2">Fast</Badge>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}