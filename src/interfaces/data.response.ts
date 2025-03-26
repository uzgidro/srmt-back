import { ReservoirEntity } from '../reservoir/reservoir.entity';

export interface ValueResponse {
  date: string;
  value: number;
}

export interface ComplexValueResponse {
  reservoir: string;
  reservoir_id: number;
  data: ValueResponse[];
}

export interface CategorisedArrayResponse {
  income: ComplexValueResponse[];
  release: ComplexValueResponse[];
  level: ComplexValueResponse[];
  volume: ComplexValueResponse[];
}

export interface ReservoiredArrayResponse {
  reservoir: ReservoirEntity;
  income: ComplexValueResponse;
  release: ComplexValueResponse;
  level: ComplexValueResponse;
  volume: ComplexValueResponse;
}

export interface CategorisedValueResponse {
  income: ComplexValueResponse;
  release: ComplexValueResponse;
  level: ComplexValueResponse;
  volume: ComplexValueResponse;
}

export interface OperativeValueResponse {
  name: string;
  income: ValueResponse[];
  release: ValueResponse[];
  level: ValueResponse[];
  volume: ValueResponse[];
}
