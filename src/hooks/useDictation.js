import { useEffect, useRef, useState } from 'react';

const SILENCE_MS = 3000;

export default function useDictation({ onText, onComplete }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);
  const silenceRef = useRef(null);
  const baseRef = useRef('');
  const finalRef = useRef('');
  const handlers = useRef({ onText, onComplete });
  handlers.current = { onText, onComplete };

  useEffect(() => {
    setSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  const clearSilence = () => {
    if (silenceRef.current) clearTimeout(silenceRef.current);
    silenceRef.current = null;
  };

  const currentText = () => `${baseRef.current}${finalRef.current}`.replace(/\s+/g, ' ').trim();

  useEffect(() => () => {
    if (silenceRef.current) clearTimeout(silenceRef.current);
    try {
      recognitionRef.current?.abort();
    } catch (error) {
      /* already closed */
    }
  }, []);

  const release = (send) => {
    clearSilence();
    const text = currentText();
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    try {
      recognition?.stop();
    } catch (error) {
      /* already stopped */
    }
    setListening(false);
    if (send && text) handlers.current.onComplete?.(text);
  };

  const armSilence = () => {
    clearSilence();
    silenceRef.current = setTimeout(() => release(true), SILENCE_MS);
  };

  const start = (seed = '') => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition || recognitionRef.current) return;

    baseRef.current = seed && seed.trim() ? `${seed.trim()} ` : '';
    finalRef.current = '';

    const recognition = new Recognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalRef.current += result[0].transcript;
        else interim += result[0].transcript;
      }
      handlers.current.onText?.(`${baseRef.current}${finalRef.current}${interim}`.replace(/\s+/g, ' '));
      armSilence();
    };
    recognition.onerror = () => release(false);
    recognition.onend = () => {
      if (recognitionRef.current === recognition) release(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    armSilence();
    try {
      recognition.start();
    } catch (error) {
      release(false);
    }
  };

  const toggle = (seed) => {
    if (recognitionRef.current) release(true);
    else start(seed);
  };

  return { listening, supported, toggle };
}