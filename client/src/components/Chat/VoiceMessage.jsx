import { useStateProvider } from "@/context/StateContext";
import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import Avatar from "../common/Avatar";
import { FaPause, FaPlay } from "react-icons/fa";
import { HOST } from "@/utils/ApiRoutes";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus";
import { MdGraphicEq } from "react-icons/md";

function VoiceMessage({ message }) {
  const [{ currentChatUser, userInfo }] = useStateProvider();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  const waveformRef = useRef(null);
  const waveform = useRef(null);

  const isIncoming = message.senderId === currentChatUser.id;
  const audioURL = `${HOST}/${message.message}`;

  useEffect(() => {
    if (!waveformRef.current) {
      return;
    }

    waveform.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#9ca3af",
      progressColor: "#22c55e",
      cursorColor: "transparent",
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 34,
      normalize: true,
      responsive: true,
    });

    waveform.current.load(audioURL);

    waveform.current.on("ready", () => {
      setTotalDuration(waveform.current.getDuration());
    });

    waveform.current.on("audioprocess", () => {
      setCurrentPlaybackTime(waveform.current.getCurrentTime());
    });

    waveform.current.on("seek", () => {
      setCurrentPlaybackTime(waveform.current.getCurrentTime());
    });

    waveform.current.on("finish", () => {
      setIsPlaying(false);
      setCurrentPlaybackTime(0);
    });

    return () => {
      if (waveform.current) {
        waveform.current.destroy();
        waveform.current = null;
      }
    };
  }, [audioURL]);

  const toggleAudio = () => {
    if (!waveform.current) {
      return;
    }

    waveform.current.playPause();
    setIsPlaying(waveform.current.isPlaying());
  };

  const formatTime = (time) => {
    if (!time || Number.isNaN(time)) {
      return "00:00";
    }

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      className={`text-white rounded-2xl px-3 py-2 w-[340px] max-w-[80vw] shadow-sm ${
        isIncoming ? "bg-incoming-background" : "bg-outgoing-background"
      }`}
    >
      <div className="flex items-center gap-3">
        <Avatar
          type="sm"
          image={
            isIncoming ? currentChatUser?.profilePicture : userInfo?.profileImage
          }
        />

        <button
          type="button"
          onClick={toggleAudio}
          className="h-10 w-10 rounded-full bg-panel-header-background flex items-center justify-center hover:scale-105 transition-transform"
          title={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? (
            <FaPause className="text-sm text-icon-green" />
          ) : (
            <FaPlay className="text-sm text-icon-green ml-[2px]" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MdGraphicEq className="text-icon-green text-lg min-w-fit" />
            <span className="text-xs text-bubble-meta">
              Voice message
            </span>
          </div>

          <div ref={waveformRef} className="w-full cursor-pointer" />

          <div className="flex justify-between items-center mt-1 text-bubble-meta text-[11px]">
            <span>
              {formatTime(isPlaying ? currentPlaybackTime : totalDuration)}
            </span>

            <div className="flex items-center gap-1">
              <span>{calculateTime(message.createdAt)}</span>

              {message.senderId === userInfo.id && (
                <MessageStatus messageStatus={message.messageStatus} />
              )}
            </div>
          </div>
        </div>
      </div>

    
    </div>
  );
}

export default VoiceMessage;