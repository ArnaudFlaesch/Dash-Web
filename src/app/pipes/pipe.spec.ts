import { advanceTo } from 'jest-date-mock';
import { DateFormatPipe } from './date-format.pipe';
import { InitialUppercasePipe } from './initial.uppercase.pipe';

describe('InitialUppercasePipe', () => {
  const component = new InitialUppercasePipe();

  it('should uppercase first letter of sentence', () => {
    expect(component.transform('lundi 25 mars')).toEqual('Lundi 25 mars');
  });
});

describe('DateFormatPipe', () => {
  const component = new DateFormatPipe();
  advanceTo(new Date(2022, 2, 15, 0, 0, 0)); // 15/03/2022

  it('should format date', () => {
    expect(component.transform(new Date())).toEqual('15/03/2022 00:00:00');
    expect(component.transform(new Date(), 'short')).toEqual('15/03/2022');
    expect(component.transform(new Date().toString())).toEqual('15/03/2022 00:00:00');
    expect(component.transform(new Date().toString(), 'short')).toEqual('15/03/2022');
  });
});
