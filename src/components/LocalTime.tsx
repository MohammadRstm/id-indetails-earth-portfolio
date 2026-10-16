import { useEffect, useMemo, useState } from 'react';

/** Current time at the location, refreshed every 20 seconds. */
export function LocalTime({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState(() => new Date());
  const format = useMemo(() => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }), [timeZone]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 20_000);
    return () => window.clearInterval(timer);
  }, []);

  return <time dateTime={now.toISOString()}>{format.format(now)} local time</time>;
}
