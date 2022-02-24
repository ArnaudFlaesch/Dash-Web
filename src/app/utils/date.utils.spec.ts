import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { DateUtilsService } from './date.utils';
describe('Date utils tests', () => {
  let spectator: SpectatorService<DateUtilsService>;
  const createSpectator = createServiceFactory({
    service: DateUtilsService
  });

  beforeEach(() => (spectator = createSpectator()));

  it('Should return a date', () => {
    expect(spectator.service.formatDateFromTimestamp(1645570800)).toEqual(
      new Date(2022, 1, 23, 0, 0, 0)
    );
  });

  it('Should return a parsed date', () => {
    expect(spectator.service.formatDateFromUTC('2022-02-23')).toEqual('23/02/2022, 00:00:00');
    expect(spectator.service.formatDateFromUTC('02-12-2022')).toEqual('12/02/2022, 00:00:00');
  });
});
