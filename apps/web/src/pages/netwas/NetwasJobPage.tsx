import { NetwasJobView } from '@humanbase/hb';
import { useNavigate, useParams } from 'react-router';
import type { NetwasLocationState } from './NetwasPage';

export function NetwasJobPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  return (
    <section className="page-section netwas-page">
      <NetwasJobView key={id} id={id} onEditAndResubmit={(draft) => void navigate('/netwas/', { state: { draft } satisfies NetwasLocationState })} />
    </section>
  );
}
