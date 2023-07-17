import { FindSubQueryStatic } from './externals/cassyllandra.interface';

export interface EntityOptions<T = object> {
  key?: Array<keyof T | Array<keyof T>>;
  indexes?: Array<keyof T> | string[];
  options?: EntityExtraOptions;
  methods?: { [index: string]: () => void };
  table_name?: string;
  materialized_views?: { [index: string]: MaterializeViewStatic<T> };
  clustering_order?: { [index: string]: 'desc' | 'asc' };
  custom_indexes?: Partial<CustomIndexOptions>[];
  es_index_mapping?: {
    discover?: string;
    properties?: EsIndexPropertiesOptionsStatic<T>;
  };
  graph_mapping?: Partial<GraphMappingOptionsStatic<T | { [index: string]: any }>>;
  [index: string]: any;
}

export type ClusterOrder<T = any> = { [P in keyof T]?: 'desc' | 'asc' };

export interface MaterializeViewStatic<T> {
  key: Array<keyof T | Array<keyof T>>;
  filter?: FilterOptions<T>;
  select?: Array<keyof T>;
  clustering_order?: ClusterOrder<T>;
}

export interface EntityExtraOptions {
  timestamps?: {
    createdAt?: string;
    updatedAt?: string;
  };
  versions?: { key: string };
}

type FilterOptions<T> = Partial<{ [P in keyof T]: FindSubQueryStatic }>;

interface CustomIndexOptions {
  on: string;
  using: any;
  options: any;
}

type EsIndexPropertiesOptionsStatic<T> = {
  [P in keyof T]?: { type?: string; index?: string };
};

interface GraphMappingOptionsStatic<Entity = any> {
  relations: {
    follow?: 'MULTI' | 'SIMPLE' | 'MANY2ONE' | 'ONE2MANY' | 'ONE2ONE';
    mother?: 'MULTI' | 'SIMPLE' | 'MANY2ONE' | 'ONE2MANY' | 'ONE2ONE';
  };
  properties: {
    [index: string]: {
      type?: JanusGraphDataTypes;
      cardinality?: 'SINGLE' | 'LIST' | 'SET';
    };
  };
  indexes: {
    [index: string]: {
      type?: 'Composite' | 'Mixed' | 'VertexCentric';
      keys?: Array<keyof Entity | NonNullable<unknown>>;
      label?: 'follow';
      order?: 'incr' | 'decr';
      unique?: boolean;
      direction?: 'BOTH' | 'IN' | 'OUT';
    };
  };
}

type JanusGraphDataTypes =
  | 'Integer'
  | 'String'
  | 'Character'
  | 'Boolean'
  | 'Byte'
  | 'Short'
  | 'Long'
  | 'Float'
  | 'Double'
  | 'Date'
  | 'Geoshape'
  | 'UUID';
