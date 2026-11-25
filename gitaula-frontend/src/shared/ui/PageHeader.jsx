import { Box, Stack, Typography } from '@mui/material';
export function PageHeader({ eyebrow, title, children, actions }) {
  return (
    <Stack
      component="header"
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ ...{ mb: 3 }, justifyContent: 'space-between' }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="overline" color="text.secondary">
          {eyebrow}
        </Typography>
        <Typography variant="h1" sx={{ overflowWrap: 'anywhere' }}>
          {title}
        </Typography>
        {children && <Box sx={{ mt: 1, color: 'text.secondary' }}>{children}</Box>}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}
