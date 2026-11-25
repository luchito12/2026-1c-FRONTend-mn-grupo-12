import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';
const FeedbackContext = createContext<(message: string) => void>(() => {});
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const notify = useCallback((value: string) => setMessage(value), []);
  return (
    <FeedbackContext.Provider value={notify}>
      {children}
      <Snackbar open={Boolean(message)} autoHideDuration={4500} onClose={() => setMessage('')}>
        <Alert severity="success" onClose={() => setMessage('')}>
          {message}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
}
export const useFeedback = () => useContext(FeedbackContext);
