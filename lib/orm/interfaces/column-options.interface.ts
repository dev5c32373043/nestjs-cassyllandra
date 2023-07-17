import { ColumnType, DataType } from './data.type';

export interface ColumnOptions {
  name?: string;
  rule?: ColumnRuleOptions | ((value: any) => boolean);
  type?: ColumnType | DataType;
  static?: boolean;
  typeDef?: string;
  default?: string | (() => any) | { $db_function: string };
  virtual?: { get?: any; set?: any };
}

export interface ColumnRuleOptions {
  ignore_default?: boolean;
  validators?: any[];
  validator?: (value: any) => boolean;
  required?: boolean;
  message?: string | ((value: any) => string);
  type_validation?: boolean;
}
