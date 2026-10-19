import { Icon } from '../Icon/Icon';
import './JobSteps.css';

export type JobStepState = 'done' | 'current' | 'upcoming' | 'stopped';

export interface JobStep {
  label: string;
  detail?: string;
  state: JobStepState;
}

const stateWords: Record<JobStepState, string> = { done: 'Done', current: 'Current step', upcoming: 'Not started', stopped: 'Stopped' };

function Marker({ state }: { state: JobStepState }) {
  if (state === 'done') return <Icon name="check-circle" size={20} />;
  if (state === 'stopped') return <Icon name="alert-circle" size={20} />;
  return <span className={`job-step-ring job-step-ring-${state}`} />;
}

export function JobSteps({ label, steps }: { label: string; steps: readonly JobStep[] }) {
  return (
    <ol className="job-steps" aria-label={label}>
      {steps.map((step) => (
        <li key={step.label} className={`job-step job-step-${step.state}`} aria-current={step.state === 'current' ? 'step' : undefined}>
          <span className="job-step-marker" aria-hidden="true">
            <Marker state={step.state} />
          </span>
          <span className="job-step-label">
            {step.label}
            <span className="visually-hidden">, {stateWords[step.state]}</span>
          </span>
          {step.detail && <span className="job-step-detail">{step.detail}</span>}
        </li>
      ))}
    </ol>
  );
}
