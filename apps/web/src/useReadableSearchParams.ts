import { readableSearch } from '@humanbase/data';
import { useCallback } from 'react';
import { useNavigate, useSearchParams, type NavigateOptions } from 'react-router';

type SearchUpdate = URLSearchParams | ((current: URLSearchParams) => URLSearchParams);

/** useSearchParams, writing the query with readableSearch so genome places keep their ':' and ','. */
export function useReadableSearchParams(): [URLSearchParams, (update: SearchUpdate, options?: NavigateOptions) => void] {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const set = useCallback(
    (update: SearchUpdate, options?: NavigateOptions) => {
      const next = typeof update === 'function' ? update(new URLSearchParams(params)) : update;
      void navigate(`?${readableSearch(next)}`, options);
    },
    [navigate, params],
  );
  return [params, set];
}
