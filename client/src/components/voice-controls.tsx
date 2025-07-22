// client/src/components/voice-controls.tsx
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useSpeech } from '@/hooks/use-speech';
import { useToast } from '@/hooks/use-toast';

interface VoiceControlsProps extends ReturnType<typeof useSpeech> {}

export function VoiceControls({ 
  isPlaying, 
  settings, 
  voices, 
  speak, 
  pause, 
  resume, 
  stop, 
  updateSettings, 
  hasContent,
  currentPosition
}: VoiceControlsProps) {
  const { toast } = useToast();

  const handlePlayPause = () => {
    if (!hasContent) {
      toast({
        title: "No content available",
        description: "Please wait for the text to be extracted from the EPUB.",
        variant: "destructive",
      });
      return;
    }

    if (!('speechSynthesis' in window)) {
      toast({
        title: "Speech not supported",
        description: "Your browser doesn't support text-to-speech functionality.",
        variant: "destructive",
      });
      return;
    }

    if (voices.length === 0) {
      toast({
        title: "Voices loading",
        description: "Please wait for voices to load, then try again.",
      });
      return;
    }

    if (isPlaying) {
      pause();
    } else if (window.speechSynthesis.paused) {
      resume();
    } else {
      speak(currentPosition);
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleRateChange = (value: number[]) => {
    updateSettings({ rate: value[0] });
  };

  const handlePitchChange = (value: number[]) => {
    updateSettings({ pitch: value[0] });
  };

  const handleVolumeChange = (value: number[]) => {
    updateSettings({ volume: value[0] });
  };

  const canUseVoice = hasContent && voices.length > 0 && 'speechSynthesis' in window;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center bg-muted rounded-full p-2 shadow-lg">
          <Button
            onClick={handlePlayPause}
            size="lg"
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={!canUseVoice}
            title={!hasContent ? "No content to read" : !canUseVoice ? "Voice not available" : "Play/Pause"}
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
            disabled={!isPlaying && !window.speechSynthesis?.paused}
            title="Stop"
          >
            <Square className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!hasContent && (
        <div className="text-center text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
          <p>Waiting for EPUB text extraction...</p>
          <p className="text-xs mt-1">The voice assistant will be available once the content is processed.</p>
        </div>
      )}

      {hasContent && voices.length === 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Loading voices...
        </div>
      )}

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
          disabled={!canUseVoice}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Slower</span>
          <span>Faster</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Pitch</label>
          <span className="text-sm text-muted-foreground">{settings.pitch.toFixed(1)}</span>
        </div>
        <Slider
          value={[settings.pitch]}
          onValueChange={handlePitchChange}
          min={0}
          max={2}
          step={0.1}
          className="w-full"
          disabled={!canUseVoice}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Volume</label>
          <span className="text-sm text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
        </div>
        <Slider
          value={[settings.volume]}
          onValueChange={handleVolumeChange}
          min={0}
          max={1}
          step={0.1}
          className="w-full"
          disabled={!canUseVoice}
        />
      </div>

      {/* Status indicator */}
      <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded text-center">
        <p>Status: {hasContent ? (canUseVoice ? 'Ready' : 'Loading...') : 'Waiting for content'}</p>
        <p>Position: {currentPosition} characters</p>
      </div>
    </div>
  );
}