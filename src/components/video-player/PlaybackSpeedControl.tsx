import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings } from 'lucide-react';

interface PlaybackSpeedControlProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export function PlaybackSpeedControl({ currentSpeed, onSpeedChange }: PlaybackSpeedControlProps) {
  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Settings className="w-4 h-4" />
          <span className="text-xs">{currentSpeed}x</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {speeds.map((speed) => (
          <DropdownMenuItem
            key={speed}
            onClick={() => onSpeedChange(speed)}
            className={currentSpeed === speed ? 'bg-accent' : ''}
          >
            {speed}x {speed === 1 && '(Normal)'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
