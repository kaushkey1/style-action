import { describe, it, expect, beforeEach } from 'vitest';
import { useTimePeriodStore } from '@/hooks/useTimePeriodStore';

describe('useTimePeriodStore', () => {
  beforeEach(() => {
    useTimePeriodStore.setState({ timePeriod: 'MTD' });
  });

  it('has default time period of "MTD"', () => {
    expect(useTimePeriodStore.getState().timePeriod).toBe('MTD');
  });

  it('sets time period to WTD', () => {
    useTimePeriodStore.getState().setTimePeriod('WTD');
    expect(useTimePeriodStore.getState().timePeriod).toBe('WTD');
  });

  it('sets time period to YTD', () => {
    useTimePeriodStore.getState().setTimePeriod('YTD');
    expect(useTimePeriodStore.getState().timePeriod).toBe('YTD');
  });

  it('cycles through all periods', () => {
    const { setTimePeriod } = useTimePeriodStore.getState();
    setTimePeriod('WTD');
    expect(useTimePeriodStore.getState().timePeriod).toBe('WTD');

    setTimePeriod('YTD');
    expect(useTimePeriodStore.getState().timePeriod).toBe('YTD');

    setTimePeriod('MTD');
    expect(useTimePeriodStore.getState().timePeriod).toBe('MTD');
  });
});
