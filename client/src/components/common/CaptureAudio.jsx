
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  FaMicrophone,
  FaPauseCircle,
  FaPlay,
  FaStop,
  FaTrash,
} from "react-icons/fa";
import { MdSend } from "react-icons/md";
import WaveSurfer from "wavesurfer.js";

import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import { ADD_AUDIO_MESSAGE_ROUTE } from "@/utils/ApiRoutes";

const getSupportedAudioFormat = () => {
  const formats = [
    { mimeType: "audio/webm;codecs=opus", extension: "webm" },
    { mimeType: "audio/mp4", extension: "m4a" },
    { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
  ];

  return formats.find(({ mimeType }) =>
    MediaRecorder.isTypeSupported(mimeType)
  );
};

const AudioRecorder = ({ hide }) => {
  const [{ userInfo, currentChatUser, socket }, dispatch] =
    useStateProvider();

  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [renderedAudio, setRenderedAudio] = useState(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioUrlRef = useRef(null);
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(false);
  const sendInProgressRef = useRef(false);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopMicrophone = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });

    mediaStreamRef.current = null;
  };

  const clearAudioUrl = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const startRecording = async () => {
    if (mediaRecorderRef.current?.state === "recording") {
      return;
    }

    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    setError("");
    setRenderedAudio(null);
    setRecordingDuration(0);
    setCurrentPlaybackTime(0);
    setTotalDuration(0);
    setIsPlaying(false);
    setIsPreparing(true);

    audioChunksRef.current = [];
    waveSurferRef.current?.stop();
    clearAudioUrl();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      mediaStreamRef.current = stream;

      const format = getSupportedAudioFormat();

      if (!format) {
        throw new Error(
          "This browser does not support the configured recording formats."
        );
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: format.mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stopTimer();
        stopMicrophone();

        if (!mountedRef.current) {
          return;
        }

        const actualMimeType = mediaRecorder.mimeType.split(";")[0];

        const audioBlob = new Blob(audioChunksRef.current, {
          type: actualMimeType,
        });

        if (audioBlob.size === 0) {
          setError("The recording is empty. Please try again.");
          setIsRecording(false);
          return;
        }

        const audioFile = new File(
          [audioBlob],
          `recording.${format.extension}`,
          { type: actualMimeType }
        );

        console.log("Recorded audio:", {
          name: audioFile.name,
          type: audioFile.type,
          size: audioFile.size,
        });

        setRenderedAudio(audioFile);

        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;

        waveSurferRef.current?.load(audioUrl);

        setIsRecording(false);
      };

      mediaRecorder.onerror = () => {
        stopTimer();
        stopMicrophone();

        if (mountedRef.current) {
          setIsRecording(false);
          setError("An error occurred while recording audio.");
        }
      };

      mediaRecorder.start();

      setIsPreparing(false);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration((previous) => previous + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);

      stopTimer();
      stopMicrophone();

      if (mountedRef.current) {
        setIsRecording(false);
        setError(err.message || "Unable to access microphone.");
      }
    } finally {
      if (mountedRef.current) {
        setIsPreparing(false);
      }
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder?.state === "recording") {
      recorder.stop();
      stopTimer();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    const waveSurfer = waveSurferRef.current;

    if (!waveSurfer || !renderedAudio) {
      return;
    }

    waveSurfer.play();
  };

  const pauseRecording = () => {
    waveSurferRef.current?.pause();
  };

  const discardRecording = () => {
    stopTimer();

    const recorder = mediaRecorderRef.current;

    if (recorder?.state === "recording") {
      recorder.onstop = null;
      recorder.stop();
    }

    stopMicrophone();
    waveSurferRef.current?.stop();
    clearAudioUrl();

    setRenderedAudio(null);
    setIsRecording(false);
    setIsPlaying(false);

    hide();
  };

  const sendRecording = async () => {
    if (
      !renderedAudio ||
      !userInfo?.id ||
      !currentChatUser?.id ||
      sendInProgressRef.current
    ) {
      return;
    }

    sendInProgressRef.current = true;
    setIsSending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", renderedAudio);

      const response = await axios.post(
        ADD_AUDIO_MESSAGE_ROUTE,
        formData,
        {
          params: {
            from: userInfo.id,
            to: currentChatUser.id,
          },
        }
      );

      if (response.status === 201) {
        socket?.current?.emit("send-msg", {
          to: currentChatUser.id,
          from: userInfo.id,
          message: response.data.message,
        });

        dispatch({
          type: reducerCases.ADD_MESSAGE,
          newMessage: {
            ...response.data.message,
          },
          fromSelf: true,
        });

        hide();
      } else {
        setError("Unable to send the voice message.");
      }
    } catch (err) {
      console.error("Audio upload failed:", err);

      setError(
        err.response?.data?.message ||
          "Failed to send the voice message. Please try again."
      );
    } finally {
      sendInProgressRef.current = false;

      if (mountedRef.current) {
        setIsSending(false);
      }
    }
  };

  const formatTime = (time) => {
    if (!Number.isFinite(time)) {
      return "00:00";
    }

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  useEffect(() => {
    mountedRef.current = true;

    const waveSurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#cccccc",
      progressColor: "#4a9eff",
      cursorColor: "#7ae3c3",
      barWidth: 2,
      height: 30,
      responsive: true,
    });

    waveSurferRef.current = waveSurfer;

    waveSurfer.on("ready", () => {
      if (!mountedRef.current) {
        return;
      }

      setTotalDuration(waveSurfer.getDuration());
    });

    waveSurfer.on("audioprocess", () => {
      if (!mountedRef.current) {
        return;
      }

      setCurrentPlaybackTime(waveSurfer.getCurrentTime());
    });

    waveSurfer.on("play", () => {
      if (mountedRef.current) {
        setIsPlaying(true);
      }
    });

    waveSurfer.on("pause", () => {
      if (mountedRef.current) {
        setIsPlaying(false);
      }
    });

    waveSurfer.on("finish", () => {
      if (mountedRef.current) {
        setIsPlaying(false);
        setCurrentPlaybackTime(0);
      }
    });

    startRecording();

    return () => {
      mountedRef.current = false;

      stopTimer();

      const recorder = mediaRecorderRef.current;

      if (recorder?.state === "recording") {
        recorder.onstop = null;
        recorder.stop();
      }

      stopMicrophone();
      waveSurfer.destroy();
      waveSurferRef.current = null;

      clearAudioUrl();
    };
  }, []);

  return (
    <div className="flex w-full items-center justify-end gap-3 text-white">
      <button
        type="button"
        onClick={discardRecording}
        disabled={isSending}
        className="text-panel-header-icon text-xl disabled:opacity-50"
        title="Discard recording"
      >
        <FaTrash />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-search-input-container-background px-4 py-3 shadow-lg">
        {isPreparing ? (
          <div className="flex flex-1 items-center justify-center text-sm">
            Preparing microphone...
          </div>
        ) : isRecording ? (
          <>
            <FaMicrophone className="animate-pulse text-red-500" />

            <div className="flex-1 text-sm">
              Recording ({formatTime(recordingDuration)})
            </div>

            <button
              type="button"
              onClick={stopRecording}
              className="text-xl text-red-500"
              title="Stop recording"
            >
              <FaStop />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={isPlaying ? pauseRecording : playRecording}
              disabled={!renderedAudio || isSending}
              className="text-xl disabled:opacity-40"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FaPauseCircle /> : <FaPlay />}
            </button>

            <div className="min-w-0 flex-1">
              <div ref={waveformRef} className="w-full" />
            </div>

            <span className="text-xs whitespace-nowrap">
              {formatTime(
                isPlaying ? currentPlaybackTime : totalDuration
              )}
            </span>

            {!renderedAudio && (
              <button
                type="button"
                onClick={startRecording}
                disabled={isPreparing || isSending}
                className="text-xl disabled:opacity-40"
                title="Start recording"
              >
                <FaMicrophone />
              </button>
            )}
          </>
        )}

        <div
          ref={waveformRef}
          className={isRecording || isPreparing ? "hidden" : "hidden"}
          style={{ display: "none" }}
        />
      </div>

      <button
        type="button"
        onClick={sendRecording}
        disabled={!renderedAudio || isRecording || isSending}
        className="rounded-full bg-icon-green p-3 text-xl disabled:opacity-40"
        title="Send recording"
      >
        <MdSend />
      </button>

      {error && (
        <div className="text-xs text-red-400">{error}</div>
      )}
    </div>
  );
};

export default AudioRecorder;
