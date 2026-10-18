import { useState } from 'react';

export function useControlled<T>(value: T | undefined, initial: T) {
  const [own, setOwn] = useState(initial);
  return [value ?? own, setOwn] as const;
}
