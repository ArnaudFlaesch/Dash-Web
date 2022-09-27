import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { DateUtilsService } from './date.utils.service';

import { format } from 'date-fns';
describe('Date utils service tests', () => {
  let spectator: SpectatorService<DateUtilsService>;
  const createService = createServiceFactory(DateUtilsService);

  const dateFormat = 'dd/MM/yyyy H:mm:ss';

  beforeEach(() => (spectator = createService()));

  it('Should format date from timestamp', () => {
    const timestamp = 1646587788;
    const timezone = 3600;
    const timeOffset = spectator.service.adjustTimeWithOffset(timezone);
    expect(format(spectator.service.formatDateFromTimestamp(timestamp), dateFormat)).toEqual(
      '06/03/2022 18:29:48'
    );
    expect(timeOffset).toEqual(-10800);
    expect(
      format(spectator.service.formatDateFromTimestamp(timestamp, timeOffset), dateFormat)
    ).toEqual('06/03/2022 15:29:48');
  });

  it('Should format', () => {});
});
