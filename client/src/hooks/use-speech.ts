import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceSettings } from '@/types/document';

export function useSpeech(text: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>({
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: '',
  });
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const hasContent = text && text.trim().length > 0;

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  }, []);

  // Effect to stop speech if the document text changes
  useEffect(() => {
    stop();
  }, [text, stop]);

  useEffect(() => {
    const handleVoicesChanged = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (!settings.voice && availableVoices.length > 0) {
        const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
        if (defaultVoice) {
          updateSettings({ voice: defaultVoice.voiceURI });
        }
      }
    };
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        handleVoicesChanged();
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        stop();
      }
    };
  }, []); // Intentionally empty to run once

  const speak = useCallback(() => {
    if (!('speechSynthesis' in window) || !text) {
      console.error('Speech synthesis not supported or no text provided.');
      return;
    }
    stop(); // Stop any previous utterance before starting a new one

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    const selectedVoice = voices.find((v) => v.voiceURI === settings.voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e);
        setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [settings, voices, text, stop]);

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

  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return { isPlaying, settings, voices, speak, pause, resume, stop, updateSettings, hasContent };
}