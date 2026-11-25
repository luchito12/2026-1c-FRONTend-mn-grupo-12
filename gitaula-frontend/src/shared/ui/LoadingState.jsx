import { Box, Skeleton, Stack, Typography } from '@mui/material';
export function LoadingState({ label = 'Cargando…', fullPage = false }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{ p: 3, minHeight: fullPage ? '100dvh' : 160, display: 'grid', alignContent: 'center' }}
    >
      <Stack spacing={2} sx={{ width: '100%', maxWidth: 720, mx: 'auto' }}>
        <Typography color="text.secondary">{label}</Typography>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={80} />
      </Stack>
    </Box>
  );
}
