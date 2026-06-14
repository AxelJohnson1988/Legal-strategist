import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionStatus } from '../types';
import { floatTo16BitPCM, arrayBufferToBase64, decodeAudioData, base64ToArrayBuffer } from '../utils/audioUtils';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export const useLiveApi = (onAgentText?: (text: string) => void) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [volume, setVolume] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  
  // Refs to capture updated callback values without rebuilding memoized connect
  const onAgentTextRef = useRef(onAgentText);
  useEffect(() => {
    onAgentTextRef.current = onAgentText;
  }, [onAgentText]);

  // Refs for audio handling to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  const initializeAudio = async () => {
    // Initialize AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass({ sampleRate: OUTPUT_SAMPLE_RATE });
    audioContextRef.current = ctx;
    
    // Output node for playing back model audio
    const outputNode = ctx.createGain();
    outputNode.connect(ctx.destination);
    outputNodeRef.current = outputNode;

    return ctx;
  };

  const connect = useCallback(async () => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY not found in environment variables");
      }
      
      setStatus(ConnectionStatus.CONNECTING);
      
      // Initialize Audio Context first (must be after user gesture technically, so we call this in connect)
      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = await initializeAudio();
      } else if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Initialize GenAI
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      aiRef.current = ai;

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: INPUT_SAMPLE_RATE,
        channelCount: 1,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true
      }});
      streamRef.current = stream;

      // Setup Input Processing
      const source = ctx.createMediaStreamSource(stream);
      inputSourceRef.current = source;
      
      // Use ScriptProcessor for raw PCM access (Worklet is better but more complex to setup in single file constraint)
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setVolume(prev => Math.max(rms, prev * 0.8)); // Smooth decay

        // Convert to 16-bit PCM and send
        const pcmData = floatTo16BitPCM(inputData);
        const base64Data = arrayBufferToBase64(pcmData);

        if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then(session => {
            session.sendRealtimeInput({
              media: {
                mimeType: 'audio/pcm;rate=16000',
                data: base64Data
              }
            });
          }).catch(err => console.error("Error sending audio:", err));
        }
      };

      source.connect(processor);
      processor.connect(ctx.destination); // Mute self to avoid feedback loop? No, ScriptProcessor needs connection.
      // Actually, we usually connect processor to destination but set its gain to 0 to avoid hearing yourself.
      // But for ScriptProcessor, if we don't connect it to destination, it might not fire.
      // We rely on echoCancellation to handle feedback, or use a silent gain node.

      // Connection to Live API
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
          },
          systemInstruction: `You are Phoenix Legal Strategist, an advanced AI legal consultant designed for high-stakes litigation support and investigative strategy. 
          Your persona is analytical, formal, and objective. You help users navigate complex legal battles, analyze case law, and develop tactical advantages in litigation.
          
          Key Concepts to know:
          1. Case Law Analysis: You provide insights into relevant precedents and how they might apply to the user's specific legal situation.
          2. Evidence Synthesis: You help organize and analyze disparate pieces of evidence to identify patterns or gaps in a legal case.
          3. Procedural Guidance: You explain legal procedures, filing requirements, and court protocols to ensure the user is prepared.
          4. Tactical Operations: You help the user anticipate opposing counsel's moves and prepare robust counter-arguments.
          
          Tone: Professional, measured, authoritative, and strategically aggressive where appropriate. 
          Focus on legal ethics, evidentiary standards, and procedural rigor.
          Keep responses concise and structured for voice-based interaction.`,
        },
        callbacks: {
          onopen: () => {
            console.log("Session Opened");
            setStatus(ConnectionStatus.CONNECTED);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const serverContent = msg.serverContent;
            
            // Handle Text Output (Transcription)
            if (serverContent?.modelTurn?.parts) {
              const textParts = serverContent.modelTurn.parts.map(p => p.text).filter(Boolean).join('');
              if (textParts && onAgentTextRef.current) {
                onAgentTextRef.current(textParts);
              }
            }

            // Handle Audio Output
            if (serverContent?.modelTurn?.parts?.[0]?.inlineData) {
              const base64Audio = serverContent.modelTurn.parts[0].inlineData.data;
              if (base64Audio && ctx) {
                 const audioData = new Uint8Array(base64ToArrayBuffer(base64Audio));
                 const audioBuffer = await decodeAudioData(audioData, ctx, OUTPUT_SAMPLE_RATE, 1);
                 
                 const source = ctx.createBufferSource();
                 source.buffer = audioBuffer;
                 source.connect(outputNodeRef.current!);
                 
                 const currentTime = ctx.currentTime;
                 const startTime = Math.max(currentTime, nextStartTimeRef.current);
                 source.start(startTime);
                 nextStartTimeRef.current = startTime + audioBuffer.duration;
              }
            }

            // Handle interruptions
            if (serverContent?.interrupted) {
               nextStartTimeRef.current = 0;
               // In a real app we would cancel currently playing nodes, but we don't track them all here for simplicity.
               // We reset the cursor at least.
            }
          },
          onclose: () => {
            console.log("Session Closed");
            setStatus(ConnectionStatus.DISCONNECTED);
          },
          onerror: (err) => {
            console.error("Session Error", err);
            setStatus(ConnectionStatus.ERROR);
            setConnectError(err instanceof Error ? err.message : String(err));
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to connect", error);
      setStatus(ConnectionStatus.ERROR);
      let userFriendlyMsg = "Connection failed. Please verify setup.";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied') || error.message?.includes('not allowed')) {
          userFriendlyMsg = "MICROPHONE PERMISSION DENIED: The browser or sandbox iframe environment blocked microphone stream access. Please click 'Open in New Tab' at the top-right of your preview to authorize access outside the sandboxed iframe.";
        } else if (error.name === 'NotFoundError' || error.message?.includes('Could not start video source')) {
          userFriendlyMsg = "MIC RECORDING DEVICE NOT FOUND: Please verify that your system micro-acoustic input device is enabled and functional.";
        } else {
          userFriendlyMsg = error.message;
        }
      } else {
        userFriendlyMsg = String(error);
      }
      setConnectError(userFriendlyMsg);
    }
  }, [isMuted]);

  const sendTextMessage = useCallback(async (text: string) => {
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        if (session.send) {
          session.send({
            clientContent: {
              turns: [{
                role: 'user',
                parts: [{ text }]
              }],
              turnComplete: true
            }
          });
        } else if (session.sendRealtimeInput) {
          session.sendRealtimeInput({ text });
        }
      } catch (err) {
        console.error("Error sending text via Live API:", err);
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (sessionPromiseRef.current) {
        // There isn't a clean "disconnect" on the promise itself in the snippet, 
        // but we can close media streams and context.
        // The SDK usually has a way to close, but based on the snippet we just close local resources.
        // sessionPromise.then(s => s.close()) would be ideal if available.
        sessionPromiseRef.current.then((session: any) => {
            if (session.close) session.close();
        }).catch(() => {});
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }

    if (inputSourceRef.current) {
        inputSourceRef.current.disconnect();
        inputSourceRef.current = null;
    }

    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }

    sessionPromiseRef.current = null;
    setStatus(ConnectionStatus.DISCONNECTED);
    setVolume(0);
    setConnectError(null);
  }, []);

  const toggleMute = () => setIsMuted(!isMuted);

  return {
    status,
    connect,
    disconnect,
    volume,
    isMuted,
    toggleMute,
    sendTextMessage,
    connectError
  };
};