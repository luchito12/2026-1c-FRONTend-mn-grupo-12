import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
const sizes = [10, 20, 50];
export function usePagedSearch() {
  const [params, setParams] = useSearchParams();
  const rawPage = params.get('page') ?? '0';
  const page =
    /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) && Number(rawPage) <= 2147483647
      ? Number(rawPage)
      : 0;
  const size = sizes.includes(Number(params.get('size'))) ? Number(params.get('size')) : 10;
  const q = (params.get('q') ?? '').slice(0, 200).trim();
  const status = ['ALL', 'UNREAD', 'READ'].includes(params.get('status'))
    ? params.get('status')
    : 'ALL';
  const change = useCallback(
    (values, replace = false) =>
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          Object.entries(values).forEach(([key, value]) => {
            if (value === '' || value === 'ALL' || (key === 'page' && value === 0))
              next.delete(key);
            else next.set(key, String(value));
          });
          return next;
        },
        { replace },
      ),
    [setParams],
  );
  const setPage = useCallback(
    (value, replace = false) => change({ page: value }, replace),
    [change],
  );
  return {
    page,
    size,
    q,
    status,
    setPage,
    setSize: (value) => change({ size: value, page: 0 }),
    search: (value) => change({ q: value.trim(), page: 0 }),
    setStatus: (value) => change({ status: value, page: 0 }),
  };
}
export function useValidPage(result, page, setPage) {
  const totalPages = result?.totalPages;
  useEffect(() => {
    if (totalPages !== undefined && page > Math.max(0, totalPages - 1))
      setPage(Math.max(0, totalPages - 1), true);
  }, [totalPages, page, setPage]);
}
