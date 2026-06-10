import { reducerCases } from "./constants";

export const initialState = {
  userInfo: undefined,
  newUser: false,
  contactsPage: false,
  messageSearch: false,
  currentChatUser: undefined,
  socket: undefined,
  messages: [],
  userContacts: [],
  videoCall: undefined,
  voiceCall: undefined,
  incomingVoiceCall: undefined,
  incomingVideoCall: undefined,
  onlineUsers: [],
  contactSearch: "",
  filteredContacts: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case reducerCases.SET_USER_INFO:
      return {
        ...state,
        userInfo: action.userInfo,
      };
    case reducerCases.SET_NEW_USER:
      return {
        ...state,
        newUser: action.newUser,
      };
    case reducerCases.SET_ALL_CONTACTS_PAGE:
      return {
        ...state,
        contactsPage: !state.contactsPage,
      };
    case reducerCases.SET_MESSAGES_SEARCH:
      return {
        ...state,
        messageSearch: !state.messageSearch,
      };
    case reducerCases.CHANGE_CURRENT_CHAT_USER: {
      if (action.user) {
        if (state.contactsPage) {
          return {
            ...state,
            currentChatUser: action.user,
            messages: [],
          };
        }
        state.socket.current.emit("mark-read", {
          id: action.user.id,
          recieverId: state.userInfo.id,
        });
        const clonedContacts = [...state.userContacts];
        const index = clonedContacts.findIndex(
          (contact) => contact.id === action.user.id
        );
        clonedContacts[index].totalUnreadMessages = 0;
        return {
          ...state,
          currentChatUser: action.user,
          messageSearch: false,
          messages: [],
          userContacts: clonedContacts,
        };
      }
    }
    case reducerCases.SET_SOCKET:
      return {
        ...state,
        socket: action.socket,
      };
    case reducerCases.ADD_MESSAGE: {
      if (
        state.currentChatUser?.id === action.newMessage.senderId ||
        action?.fromSelf
      ) {
        state.socket.current.emit("mark-read", {
          id: action.newMessage.senderId,
          recieverId: action.newMessage.recieverId,
        });

        const clonedContacts = [...state.userContacts];
        if (action.newMessage.recieverId === state.userInfo.id) {
          const index = clonedContacts.findIndex(
            (contact) => contact.id === action.newMessage.senderId
          );
          if (index !== -1) {
            const data = clonedContacts[index];
            data.message = action.newMessage.message;
            data.type = action.newMessage.type;
            data.messageId = action.newMessage.id;
            data.messageStatus = action.newMessage.messageStatus;
            data.recieverId = action.newMessage.recieverId;
            data.senderId = action.newMessage.senderId;
            clonedContacts.splice(index, 1);
            clonedContacts.unshift(data);
          }
          return {
            ...state,
            messages: [...state.messages, action.newMessage],
            userContacts: clonedContacts,
          };
        } else {
          const index = clonedContacts.findIndex(
            (contact) => contact.id === action.newMessage.recieverId
          );
          if (index !== -1) {
            const data = clonedContacts[index];
            data.message = action.newMessage.message;
            data.type = action.newMessage.type;
            data.messageId = action.newMessage.id;
            data.messageStatus = action.newMessage.messageStatus;
            data.recieverId = action.newMessage.recieverId;
            data.senderId = action.newMessage.senderId;
            clonedContacts.splice(index, 1);
            clonedContacts.unshift(data);
          } else {
            const {
              message,
              type,
              id,
              messageStatus,
              recieverId,
              senderId,
              createdAt,
            } = action.newMessage;
            const data = {
              message,
              type,
              messageId: id,
              messageStatus,
              recieverId,
              senderId,
              createdAt,
              id: action.newMessage.reciever.id,
              name: action.newMessage.reciever.name,
              profilePicture: action.newMessage.reciever.profilePicture,
              totalUnreadMessages: action.fromSelf ? 0 : 1,
            };
            clonedContacts.unshift(data);
          }
          return {
            ...state,
            messages: [...state.messages, action.newMessage],
            userContacts: clonedContacts,
          };
        }
      } else {
        const clonedContacts = [...state.userContacts];
        const index = clonedContacts.findIndex(
          (contact) => contact.id === action.newMessage.senderId
        );
        if (index !== -1) {
          const data = clonedContacts[index];
          data.message = action.newMessage.message;
          data.type = action.newMessage.type;
          data.messageId = action.newMessage.id;
          data.messageStatus = action.newMessage.messageStatus;
          data.recieverId = action.newMessage.recieverId;
          data.senderId = action.newMessage.senderId;
          data.totalUnreadMessages += 1;
          clonedContacts.splice(index, 1);
          clonedContacts.unshift(data);
        } else {
          const {
            message,
            type,
            id,
            messageStatus,
            recieverId,
            senderId,
            createdAt,
          } = action.newMessage;
          const data = {
            message,
            type,
            messageId: id,
            messageStatus,
            recieverId,
            senderId,
            createdAt,
            id: action.newMessage.sender.id,
            name: action.newMessage.sender.name,
            profilePicture: action.newMessage.sender.profilePicture,
            totalUnreadMessages: action.fromSelf ? 0 : 1,
          };
          clonedContacts.unshift(data);
        }

        return {
          ...state,
          userContacts: clonedContacts,
        };
      }
    }
    case reducerCases.SET_MESSAGES:
      return {
        ...state,
        messages: action.messages,
      };
    case reducerCases.SET_USER_CONTACTS:
      return {
        ...state,
        userContacts: action.userContacts,
      };
    case reducerCases.SET_VIDEO_CALL:
      return {
        ...state,
        videoCall: action.videoCall,
      };
    case reducerCases.SET_VOICE_CALL:
      return {
        ...state,
        voiceCall: action.voiceCall,
      };
    case reducerCases.END_CALL:
      return {
        ...state,
        videoCall: undefined,
        voiceCall: undefined,
        incomingVoiceCall: undefined,
        incomingVideoCall: undefined,
      };
    case reducerCases.SET_INCOMING_VOICE_CALL:
      return {
        ...state,
        incomingVoiceCall: action.incomingVoiceCall,
      };
    case reducerCases.SET_INCOMING_VIDEO_CALL:
      return {
        ...state,
        incomingVideoCall: action.incomingVideoCall,
      };
    case reducerCases.SET_EXIT_CHAT:
      return {
        ...state,
        currentChatUser: undefined,
        messages: [],
      };
    case reducerCases.SET_MESSAGES_READ: {
      if (state.userInfo.id === action.id) {
        const clonedMessages = [...state.messages];
        const clonedContacts = [...state.userContacts];
        clonedMessages.forEach(
          (msg, index) => (clonedMessages[index].messageStatus = "read")
        );
        const index = clonedContacts.findIndex(
          (contact) => contact.id === action.recieverId
        );
        if (index !== -1) {
          clonedContacts[index].messageStatus = "read";
        }
        return {
          ...state,
          messages: clonedMessages,
          userContacts: clonedContacts,
        };
      } else {
        return {
          ...state,
        };
      }
    }
    case reducerCases.SET_ONLINE_USERS:
      return {
        ...state,
        onlineUsers: action.onlineUsers,
      };

    case reducerCases.SET_CONTACT_SEARCH: {
      const filteredContacts = state.userContacts.filter((contact) =>
        contact.name.toLowerCase().includes(action.contactSearch.toLowerCase())
      );
      return {
        ...state,
        contactSearch: action.contactSearch,
        filteredContacts,
      };
    }
    default:
      return state;
  }
};

export default reducer;
