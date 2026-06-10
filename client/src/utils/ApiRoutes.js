export const HOST =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3005";

const authRoute = `${HOST}/api/auth`;
const messageRoute = `${HOST}/api/messages`;

export const checkUserRoute = `${authRoute}/check-user`;
export const onBoardUserRoute = `${authRoute}/onboarduser`;
export const getAllContacts = `${authRoute}/get-contacts`;
export const GET_CALL_TOKEN = `${authRoute}/generate-token`;

export const addMessageRoute = `${messageRoute}/add-message`;
export const getMessagesRoute = `${messageRoute}/get-messages`;
export const addImageMessageRoute = `${messageRoute}/add-image-message`;
export const addAudioMessageRoute = `${messageRoute}/add-audio-message`;
export const getInitialContactsRoute = `${messageRoute}/get-initial-contacts`;
export const SEARCH_MESSAGES_ROUTE = `${messageRoute}/search`;

// Backward-compatible uppercase exports used by existing components.
export const CHECK_USER_ROUTE = checkUserRoute;
export const GET_ALL_CONTACTS = getAllContacts;
export const ADD_MESSAGE_ROUTE = addMessageRoute;
export const GET_MESSAGES_ROUTE = getMessagesRoute;
export const ADD_IMAGE_MESSAGE_ROUTE = addImageMessageRoute;
export const ADD_AUDIO_MESSAGE_ROUTE = addAudioMessageRoute;
export const GET_INITIAL_CONTACTS_ROUTE = getInitialContactsRoute;