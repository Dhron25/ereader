// client/src/hooks/use-speech.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceSettings } from '@/types/document';

export function useSpeech(text: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [readingSpeed, setReadingSpeed] = useState(200); // words per minute
  const [settings, setSettings] = useState<VoiceSettings>({
    rate: 1,
    pitch: 1,
    volume: 1,
    voice: '',
  });
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const positionTrackingRef = useRef<NodeJS.Timeout | null>(null);
  const hasContent = text && text.trim().length > 0;
  const isInitializedRef = useRef(false);

  // Update total characters when text changes
  useEffect(() => {
    setTotalCharacters(text?.length || 0);
  }, [text]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        if (utteranceRef.current) {
          utteranceRef.current = null;
        }
        if (positionTrackingRef.current) {
          clearInterval(positionTrackingRef.current);
          positionTrackingRef.current = null;
        }
        setIsPlaying(false);
        setStartTime(null);
        console.log('Speech stopped');
      } catch (error) {
        console.error('Error stopping speech:', error);
        setIsPlaying(false);
      }
    }
  }, []);

  // Track reading position during speech
  const startPositionTracking = useCallback((startIndex: number, textLength: number) => {
    if (positionTrackingRef.current) {
      clearInterval(positionTrackingRef.current);
    }

    const wordsPerSecond = (readingSpeed * settings.rate) / 60;
    const avgCharsPerWord = 5; // Average characters per word
    const charsPerSecond = wordsPerSecond * avgCharsPerWord;

    positionTrackingRef.current = setInterval(() => {
      if (window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        setCurrentPosition(prev => {
          const newPosition = Math.min(startIndex + prev + charsPerSecond, textLength);
          return newPosition - startIndex;
        });
      }
    }, 1000);
  }, [readingSpeed, settings.rate]);

  const loadVoices = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech Synthesis not supported');
      return;
    }

    const availableVoices = window.speechSynthesis.getVoices();
    
    if (availableVoices.length > 0) {
      setVoices(availableVoices);
      
      if (!settings.voice && !isInitializedRef.current) {
        const englishVoice = availableVoices.find(v => 
          v.lang.startsWith('en') && !v.name.toLowerCase().includes('google')
        );
        const defaultVoice = englishVoice || availableVoices.find(v => v.default) || availableVoices[0];
        
        if (defaultVoice) {
          setSettings(prev => ({ ...prev, voice: defaultVoice.voiceURI }));
          isInitializedRef.current = true;
        }
      }
    } else {
      setTimeout(loadVoices, 100);
    }
  }, [settings.voice]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      loadVoices();
      
      const handleVoicesChanged = () => {
        loadVoices();
      };

      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    }
  }, [loadVoices]);

  const speak = useCallback((startIndex: number = 0) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported in this browser.');
      return;
    }
    
    if (!text || text.trim().length === 0) {
      console.error('No text provided for speech synthesis.');
      return;
    }

    console.log('Starting speech from position:', startIndex);
    
    // Always stop current speech for seamless transition
    if (utteranceRef.current && window.speechSynthesis.speaking) {
      console.log('Stopping current speech for seamless transition');
      stop();
      
      // Start new speech immediately after stopping
      setTimeout(() => speak(startIndex), 50);
      return;
    }

    const textToSpeak = text.substring(startIndex);
    if (!textToSpeak) {
      console.error('No text to speak from the specified position');
      return;
    }

    // Limit text length to avoid browser issues
    const limitedText = textToSpeak.length > 32000 ? textToSpeak.substring(0, 32000) + "..." : textToSpeak;
    const utterance = new SpeechSynthesisUtterance(limitedText);
    utteranceRef.current = utterance;

    // Set voice
    const selectedVoice = voices.find((v) => v.voiceURI === settings.voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Set speech parameters
    utterance.rate = Math.max(0.1, Math.min(10, settings.rate));
    utterance.pitch = Math.max(0, Math.min(2, settings.pitch));
    utterance.volume = Math.max(0, Math.min(1, settings.volume));

    // Event handlers
    utterance.onstart = () => {
      console.log('Speech started from position:', startIndex);
      setIsPlaying(true);
      setStartTime(Date.now());
      setCurrentPosition(startIndex);
      startPositionTracking(startIndex, text.length);
    };
    
    utterance.onend = () => {
      console.log('Speech ended naturally');
      setIsPlaying(false);
      setCurrentPosition(text.length);
      if (positionTrackingRef.current) {
        clearInterval(positionTrackingRef.current);
        positionTrackingRef.current = null;
      }
      utteranceRef.current = null;
    };
    
    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
      setIsPlaying(false);
      if (positionTrackingRef.current) {
        clearInterval(positionTrackingRef.current);
        positionTrackingRef.current = null;
      }
      utteranceRef.current = null;
    };

    utterance.onpause = () => {
      setIsPlaying(false);
      if (positionTrackingRef.current) {
        clearInterval(positionTrackingRef.current);
        positionTrackingRef.current = null;
      }
    };

    utterance.onresume = () => {
      setIsPlaying(true);
      startPositionTracking(currentPosition, text.length);
    };

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error starting speech synthesis:', error);
      setIsPlaying(false);
      utteranceRef.current = null;
    }
  }, [settings, voices, text, stop, startPositionTracking, currentPosition]);

  const pause = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      try {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } catch (error) {
        console.error('Error pausing speech:', error);
      }
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      try {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error resuming speech:', error);
      }
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Calculate reading progress
  const getReadingProgress = useCallback(() => {
    if (!text || totalCharacters === 0) {
      return { percentage: 0, timeRead: 0, timeRemaining: 0 };
    }

    const percentage = (currentPosition / totalCharacters) * 100;
    
    let timeRead = 0;
    let timeRemaining = 0;
    
    if (startTime) {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      timeRead = elapsedSeconds / 60; // in minutes
      
      if (currentPosition > 0) {
        const wordsRead = text.substring(0, currentPosition).split(/\s+/).length;
        const actualWordsPerMinute = wordsRead / timeRead;
        const remainingWords = text.substring(currentPosition).split(/\s+/).length;
        timeRemaining = remainingWords / Math.max(actualWordsPerMinute, 100); // minimum 100 WPM
      } else {
        const totalWords = text.split(/\s+/).length;
        timeRemaining = totalWords / (readingSpeed * settings.rate);
      }
    } else {
      const totalWords = text.split(/\s+/).length;
      const remainingWords = text.substring(currentPosition).split(/\s+/).length;
      timeRemaining = remainingWords / (readingSpeed * settings.rate);
    }

    return {
      percentage: Math.min(percentage, 100),
      timeRead: Math.max(timeRead, 0),
      timeRemaining: Math.max(timeRemaining, 0)
    };
  }, [text, totalCharacters, currentPosition, startTime, readingSpeed, settings.rate]);

  return { 
    isPlaying, 
    settings, 
    voices, 
    speak, 
    pause, 
    resume, 
    stop, 
    updateSettings, 
    hasContent,
    currentPosition,
    getReadingProgress
  };
}