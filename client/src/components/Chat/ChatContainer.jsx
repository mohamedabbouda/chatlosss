import { useStateProvider } from "@/context/StateContext";
import React, { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { calculateTime } from "@/utils/CalculateTime";
import MessageStatus from "../common/MessageStatus";
import ImageMessage from "./ImageMessage";
import axios from "axios";
import { DELETE_MESSAGE_ROUTE } from "@/utils/ApiRoutes";
import { reducerCases } from "@/context/constants";
import { MdDeleteOutline } from "react-icons/md";

const VoiceMessage = dynamic(() => import("@/components/Chat/VoiceMessage"), {
  ssr: false,
});

export default function ChatContainer() {
  const [{ messages, currentChatUser, userInfo }, dispatch] =
    useStateProvider();

  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const lastMessage =
      container?.lastElementChild?.lastElementChild?.lastElementChild
        ?.lastElementChild;

    if (lastMessage) {
      lastMessage.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleDeleteMessage = async (messageId) => {
    const confirmed = confirm("Delete this message from the chat?");

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`${DELETE_MESSAGE_ROUTE}/${messageId}`, {
        params: {
          userId: userInfo.id,
        },
      });

      dispatch({
        type: reducerCases.DELETE_MESSAGE,
        messageId,
      });
    } catch (error) {
      alert("Could not delete message. Please try again.");
    }
  };

  const renderDeleteButton = (message) => (
    <button
      type="button"
      onClick={() => handleDeleteMessage(message.id)}
      className="opacity-0 group-hover:opacity-100 transition-opacity text-bubble-meta hover:text-red-300 text-lg"
      title="Delete message"
    >
      <MdDeleteOutline />
    </button>
  );

  return (
    <div
      className="h-[80vh] w-full relative flex-grow overflow-auto custom-scrollbar"
      ref={containerRef}
    >
      <div className="bg-chat-background bg-fixed h-full w-full opacity-5 fixed left-0 top-0 z-0"></div>

      <div className="mx-10 my-6 relative bottom-0 z-40 left-0">
        <div className="flex w-full">
          <div className="flex flex-col justify-end w-full gap-1 overflow-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`group flex items-center gap-2 ${
                  message.senderId === currentChatUser.id
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                {message.senderId !== currentChatUser.id &&
                  renderDeleteButton(message)}

                {message.type === "text" && (
                  <div
                    className={`text-white px-2 py-[5px] text-sm rounded-md flex gap-2 items-end max-w-[45%] ${
                      message.senderId === currentChatUser.id
                        ? "bg-incoming-background"
                        : "bg-outgoing-background"
                    }`}
                  >
                    <span className="break-all">{message.message}</span>

                    <div className="flex gap-1 items-end">
                      <span className="text-bubble-meta text-[11px] pt-1 min-w-fit">
                        {calculateTime(message.createdAt)}
                      </span>

                      {message.senderId === userInfo.id && (
                        <MessageStatus
                          messageStatus={message.messageStatus}
                        />
                      )}
                    </div>
                  </div>
                )}

                {message.type === "image" && <ImageMessage message={message} />}
                {message.type === "audio" && <VoiceMessage message={message} />}

                {message.senderId === currentChatUser.id &&
                  renderDeleteButton(message)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}