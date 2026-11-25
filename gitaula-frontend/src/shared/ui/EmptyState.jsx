import { Paper, Stack, Typography } from '@mui/material';
export function EmptyState({ title, children, action }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
        <Typography variant="h2">{title}</Typography>
        <Typography color="text.secondary">{children}</Typography>
        {action}
      </Stack>
    </Paper>
  );
}
