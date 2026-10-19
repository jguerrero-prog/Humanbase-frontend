import onGreen from './logo-on-green.svg?url';
import onLight from './logo-on-light.svg?url';

const sources = { green: onGreen, light: onLight };

interface LogoProps {
  surface?: keyof typeof sources;
}

export function Logo({ surface = 'light' }: LogoProps) {
  return <img src={sources[surface]} alt="Humanbase" width={150} height={29} />;
}
