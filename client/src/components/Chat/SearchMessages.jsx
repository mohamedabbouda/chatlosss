import { useStateProvider } from "@/context/StateContext";
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { BiSearchAlt2, BiArrowBack } from "react-icons/bi";
import { FaPlay } from "react-icons/fa";
import { reducerCases } from "@/context/constants";
import { calculateTime } from "@/utils/CalculateTime";
import { HOST, SEARCH_MESSAGES_ROUTE } from "@/utils/ApiRoutes";
import axios from "axios";

function SearchMessages() {
  const [{ currentChatUser, userInfo }, dispatch] = useStateProvider();
  const [searchBarFocus, setSearchBarFocus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedMessages, setSearchedMessages] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const search = async () => {
      const trimmedSearchTerm = searchTerm.trim();

      if (!trimmedSearchTerm || !userInfo?.id || !currentChatUser?.id) {
        setSearchedMessages([]);
        setSearchError("");
        return;
      }

      try {
        setIsSearching(true);
        setSearchError("");

        const { data } = await axios.get(SEARCH_MESSAGES_ROUTE, {
          params: {
            userId: userInfo.id,
            contactId: currentChatUser.id,
            query: trimmedSearchTerm,
            type: activeFilter,
          },
        });

        setSearchedMessages(data.messages || []);
      } catch (error) {
        console.error("Search request failed:", {
          url: SEARCH_MESSAGES_ROUTE,
          status: error?.response?.status,
          data: error?.response?.data,
        });

        setSearchedMessages([]);
        setSearchError("Search is unavailable right now.");
      } finally {
        setIsSearching(false);
      }
    };

    const delay = setTimeout(search, 300);
    return () => clearTimeout(delay);
  }, [searchTerm, activeFilter, userInfo?.id, currentChatUser?.id]);

  const highlightMatch = (text) => {
    if (!text || !searchTerm.trim()) return text;

    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedSearchTerm})`, "gi"));

    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={index} className="bg-teal-light text-black px-1 rounded">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  const playAudio = (path) => {
    const audio = new Audio(`${HOST}/${path}`);
    audio.play();
  };

  const filters = [
    { label: "All", value: "all" },
    { label: "Text", value: "text" },
    { label: "Audio", value: "audio" },
  ];

  return (
    <div className="border-conversation-border border-l w-full bg-conversation-panel-background flex flex-col z-10 max-h-screen">
      <div className="h-16 px-4 py-5 flex gap-10 items-center bg-panel-header-background text-primary-strong">
        <IoClose
          className="cursor-pointer text-icon-lighter text-2xl"
          onClick={() => dispatch({ type: reducerCases.SET_MESSAGES_SEARCH })}
        />
        <span>Search Messages and Voicenotes</span>
      </div>

      <div className="overflow-auto custom-scrollbar h-full">
        <div className="flex items-center flex-col w-full">
          <div className="flex px-5 items-center gap-3 h-14 w-full">
            <div className="bg-panel-header-background flex items-center gap-5 px-3 py-[6px] rounded-lg flex-grow">
              <div>
                {searchBarFocus ? (
                  <BiArrowBack className="text-icon-green cursor-pointer text-l" />
                ) : (
                  <BiSearchAlt2 className="text-panel-header-icon cursor-pointer text-l" />
                )}
              </div>

              <input
                type="text"
                placeholder="Search messages or voicenotes"
                className="bg-transparent text-sm focus:outline-none text-white w-full"
                onFocus={() => setSearchBarFocus(true)}
                onBlur={() => setSearchBarFocus(false)}
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            {filters.map((filter) => (
              <button
                key={filter.value}
                className={`px-5 py-2 rounded-lg text-sm ${
                  activeFilter === filter.value
                    ? "bg-teal-light text-black"
                    : "bg-panel-header-background text-secondary"
                }`}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <span className="mt-10 text-secondary">
            {!searchTerm.length &&
              currentChatUser?.name &&
              `Search messages and voicenotes with ${currentChatUser.name}`}
          </span>
        </div>

        <div className="flex justify-center h-full flex-col">
          {isSearching && (
            <span className="text-secondary w-full flex justify-center mt-8">
              Searching...
            </span>
          )}

          {searchError && !isSearching && (
            <span className="text-red-400 w-full flex justify-center mt-8">
              {searchError}
            </span>
          )}

          {searchTerm.length > 0 &&
            !isSearching &&
            !searchError &&
            !searchedMessages.length && (
              <span className="text-secondary w-full flex justify-center mt-8">
                No messages found
              </span>
            )}

          <div className="flex flex-col w-full h-full mt-5">
            {searchedMessages.map((message) => {
              const searchableText =
                message.type === "audio" ? message.transcript : message.message;

              return (
                <div
                  key={message.id}
                  className="flex cursor-pointer flex-col justify-center hover:bg-background-default-hover w-full px-5 border-b-[0.1px] border-secondary py-5"
                >
                  <div className="text-sm text-secondary">
                    {calculateTime(message.createdAt)}
                  </div>

                  {message.type === "audio" ? (
                    <div className="mt-2">
                      <div className="flex items-center gap-4 bg-outgoing-background rounded-md p-3">
                        <button
                          onClick={() => playAudio(message.message)}
                          className="text-white"
                        >
                          <FaPlay />
                        </button>
                        <div className="text-icon-green text-sm">
                          {message.transcript
                            ? highlightMatch(message.transcript)
                            : "Audio message has no transcript yet."}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-icon-green mt-2">
                      {highlightMatch(searchableText)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchMessages;