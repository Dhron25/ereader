import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpeech } from '@/hooks/use-speech';

interface VoiceControlsProps {
  text: string;
}

export function VoiceControls({ text }: VoiceControlsProps) {
  const { isPlaying, settings, speak, pause, resume, stop, updateSettings } = useSpeech();

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (window.speechSynthesis.paused) {
      resume();
    } else {
      speak(text);
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleRateChange = (value: number[]) => {
    updateSettings({ rate: value[0] });
  };

  const handleVoiceChange = (value: string) => {
    updateSettings({ voice: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center bg-muted rounded-full p-2 shadow-lg">
          <Button
            onClick={handlePlayPause}
            size="lg"
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
          <Button
            onClick={handleStop}
            variant="ghost"
            size="sm"
            className="ml-2 w-10 h-10 rounded-full"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Reading Speed</label>
          <span className="text-sm text-muted-foreground">{settings.rate}x</span>
        </div>
        <Slider
          value={[settings.rate]}
          onValueChange={handleRateChange}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0.5x</span>
          <span>1.0x</span>
          <span>2.0x</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Voice</label>
        <Select value={settings.voice} onValueChange={handleVoiceChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default (System)</SelectItem>
            <SelectItem value="female">Female Voice</SelectItem>
            <SelectItem value="male">Male Voice</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
