import { Button, Stack, TextField } from '@mui/material';
export function SearchForm({ query, label, onSearch }) {
  return (
    <Stack
      component="form"
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(new FormData(event.currentTarget).get('q'));
      }}
    >
      <TextField
        key={query}
        name="q"
        label={label}
        defaultValue={query}
        slotProps={{ htmlInput: { maxLength: 200 } }}
      />
      <Button type="submit" variant="outlined">
        Buscar
      </Button>
      {query && <Button onClick={() => onSearch('')}>Limpiar búsqueda</Button>}
    </Stack>
  );
}
