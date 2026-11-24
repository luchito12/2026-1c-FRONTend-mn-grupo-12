import { useAuth } from './AuthProvider.jsx';
export const useCurrentUser = () => useAuth().user;
