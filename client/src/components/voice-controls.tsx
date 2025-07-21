import { Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSpeech } from '@/hooks/use-speech';

// This component now receives all its state and functions as props.
interface VoiceControlsProps extends ReturnType<typeof useSpeech> {}

export function VoiceControls({ isPlaying, settings, voices, speak, pause, resume, stop, updateSettings, hasContent }: VoiceControlsProps) {
  
  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (window.speechSynthesis.paused) {
      resume();
    } else {
      speak();
    }
  };

  const handleRateChange = (value: number[]) => {
    updateSettings({ rate: value[0] });
  };

  const handleVoiceChange = (voiceURI: string) => {
    updateSettings({ voice: voiceURI });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center bg-muted rounded-full p-2 shadow-lg">
          <Button
            onClick={handlePlayPause}
            size="lg"
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={!hasContent || voices.length === 0}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>
          <Button
            onClick={stop}
            variant="ghost"
            size="sm"
            className="ml-2 w-10 h-10 rounded-full"
            disabled={!isPlaying && !window.speechSynthesis.paused}
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Reading Speed</label>
          <span className="text-sm text-muted-foreground">{settings.rate.toFixed(1)}x</span>
        </div>
        <Slider
          value={[settings.rate]}
          onValueChange={handleRateChange}
          min={0.5}
          max={2.0}
          step={0.1}
          className="w-full"
          disabled={!hasContent}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Slower</span>
          <span>Faster</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Voice</label>
        <Select value={settings.voice} onValueChange={handleVoiceChange} disabled={voices.length === 0 || !hasContent}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a voice..." />
          </SelectTrigger>
          <SelectContent>
            {voices.length > 0 ? (
              voices.map((voice) => (
                <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))
            ) : (
              <SelectItem value="loading" disabled>Loading voices...</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}