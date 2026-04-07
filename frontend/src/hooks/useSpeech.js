import { useState, useEffect, useRef, useCallback } from "react";

// ─── Hook 1: Text-to-Speech ────────────────────────────────────
// Speaks any text aloud using the browser's built-in voice engine.
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);

  // Cancel any ongoing speech when component unmounts
  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback((text) => {
    // Cancel whatever is currently being spoken
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Voice settings — tweak these to change how it sounds
    utterance.rate = 0.92;    // slightly slower than default — easier to follow
    utterance.pitch = 1.0;    // natural pitch
    utterance.volume = 1.0;   // full volume

    // Pick an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) utterance.voice = englishVoice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}


// ─── Hook 2: Speech-to-Text ────────────────────────────────────
// Listens to the microphone and returns a live transcript.
export function useSTT({ onResult }) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // SpeechRecognition is only available in Chrome and Edge
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;       // keep listening until we stop it
    recognition.interimResults = true;   // show partial results as user speaks
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      // Combine all result segments into one string
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onResult(transcript);   // send live transcript to parent component
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !listening) {
      recognitionRef.current.start();
      setListening(true);
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, [listening]);

  return { startListening, stopListening, listening, supported };
}