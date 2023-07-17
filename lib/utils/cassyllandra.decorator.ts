import { Inject } from '@nestjs/common';
import { getModelToken, getRepositoryToken } from './orm.utils';
import { CONNECTION_TOKEN } from '../constants';

export const InjectConnection: () => ParameterDecorator = () => Inject(CONNECTION_TOKEN);

export const InjectRepository = (entity: any) => Inject(getRepositoryToken(entity));

export const InjectModel = (entity: any) => Inject(getModelToken(entity));
