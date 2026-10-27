import { ApiReferenceView } from '@humanbase/hb';
import { useLocation } from 'react-router';
import { site } from '../../../docs/src/data/site';

export function ApiReferencePage() {
  const { pathname, hash } = useLocation();
  return (
    <>
      <title>Humanbase API · Humanbase</title>
      <ApiReferenceView location={pathname + hash} publicApi={site.publicApi} />
    </>
  );
}
