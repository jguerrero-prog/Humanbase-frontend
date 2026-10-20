import { JobsList } from '@humanbase/hb';
import { useNavigate } from 'react-router';

export function JobsPage() {
  const navigate = useNavigate();
  return (
    <div className="page-section">
      <title>Jobs · Humanbase</title>
      <JobsList onOpenJob={(link) => void navigate(link)} />
    </div>
  );
}
