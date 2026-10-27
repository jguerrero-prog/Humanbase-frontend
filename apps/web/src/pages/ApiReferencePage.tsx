import { ApiReferenceView } from '@humanbase/hb';
import { useLocation } from 'react-router';

export function ApiReferencePage() {
  const { pathname, hash } = useLocation();
  return (
    <>
      <title>Humanbase API · Humanbase</title>
      <ApiReferenceView location={pathname + hash} />
    </>
  );
}
