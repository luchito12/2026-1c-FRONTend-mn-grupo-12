import { TablePagination } from '@mui/material';
export function PagePagination({ result, page, size, onPageChange, onSizeChange, busy }) {
  return (
    <TablePagination
      component="div"
      count={result.totalElements}
      page={Math.min(page, Math.max(0, result.totalPages - 1))}
      rowsPerPage={size}
      rowsPerPageOptions={[10, 20, 50]}
      onPageChange={(_, next) => onPageChange(next)}
      onRowsPerPageChange={(event) => onSizeChange(Number(event.target.value))}
      disabled={busy}
      labelRowsPerPage="Por página"
      labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
      getItemAriaLabel={(type) =>
        ({
          next: 'Página siguiente',
          previous: 'Página anterior',
          first: 'Primera página',
          last: 'Última página',
        })[type]
      }
      sx={{
        '.MuiTablePagination-toolbar': { flexWrap: 'wrap', justifyContent: 'flex-end', px: 0 },
        '.MuiTablePagination-spacer': { display: { xs: 'none', sm: 'block' } },
        '.MuiTablePagination-actions': { ml: 1 },
      }}
    />
  );
}
