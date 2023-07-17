import { randUuid, randSports, randUserName, randNumber, randPastDate } from '@ngneat/falso';

interface ActivityData {
  id: string;
  action: string;
  username: string;
  value: number;
  time: Date;
}

const generateActivity = (data: Partial<ActivityData> = {}) => ({
  id: randUuid(),
  action: randSports(),
  username: randUserName(),
  value: randNumber({ min: 1 }),
  time: new Date(randPastDate()),
  ...data,
});

export default generateActivity;
