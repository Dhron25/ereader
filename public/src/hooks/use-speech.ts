import { useState, useRef, useCallback } from 'react';
import { VoiceSettings } from '@/types/document';

export function useSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [settings, setSettings] = useState<VoiceSettings>({
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: 'default',
  });
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef<string>('');

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();

    textRef.current = text;
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    utterance.onstart = () => {
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentPosition(0);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setCurrentPosition(0);
    };

    utterance.onboundary = (event) => {
      setCurrentPosition(event.charIndex);
    };

    window.speechSynthesis.speak(utterance);
  }, [settings]);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentPosition(0);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    isPlaying,
    currentPosition,
    settings,
    speak,
    pause,
    resume,
    stop,
    updateSettings,
  };
}

// gg