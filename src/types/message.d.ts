export type MessageAction =
  | 'GET_PROFILE'
  | 'GET_ALL_PROFILES'
  | 'SAVE_PROFILE'
  | 'DELETE_PROFILE'
  | 'SET_ACTIVE_PROFILE'
  | 'GET_ACTIVE_PROFILE'
  | 'FILL_FORM'
  | 'SCAN_FORM'
  | 'GET_FILL_RESULT';

export interface Message {
  action: MessageAction;
  data?: any;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}
