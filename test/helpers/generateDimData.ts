import {
  randUuid,
  randEmail,
  randFullAddress,
  randIp,
  randBoolean,
  randNumber,
  randPastDate,
  randSubscriptionPlan,
  randQuote,
} from '@ngneat/falso';

interface DimData {
  id: string;
  user: string;
  location: string;
  ip: string;
  activeUser: boolean;
  value: number;
  date: Date;
  subscription: string;
  comment: string;
}

const generateDimData = (data: Partial<DimData> = {}) => ({
  id: randUuid(),
  user: randEmail(),
  location: randFullAddress(),
  ip: randIp(),
  activeUser: randBoolean(),
  value: randNumber({ min: 1, max: 100 }),
  date: new Date(randPastDate()),
  subscription: randSubscriptionPlan(),
  comment: randQuote(),
  ...data,
});

export default generateDimData;
