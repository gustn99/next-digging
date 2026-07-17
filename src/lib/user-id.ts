import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'woowa_user_id';

export function getOrCreateUserId(): string {
  // Ensure we are in the browser environment
  if (typeof window === 'undefined') {
    return '';
  }

  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
}

export function getUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(USER_ID_KEY);
}
