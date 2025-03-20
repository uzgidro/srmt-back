import { ReservoirEntity } from '../reservoir/reservoir.entity';

export interface ValueResponse {
  date: string
  value: number
}

export interface ComplexValueResponse {
  reservoir: string
  reservoir_id: number
  category: string
  data: ValueResponse[]
}

export interface CategorisedArrayResponse {
  income: ComplexValueResponse[]
  release: ComplexValueResponse[]
  level: ComplexValueResponse[]
  volume: ComplexValueResponse[]
}

export interface ReservoiredArrayResponse {
  reservoir: ReservoirEntity
  income: ComplexValueResponse
  release: ComplexValueResponse
  level: ComplexValueResponse
  volume: ComplexValueResponse
}

export interface CategorisedValueResponse {
  income: ComplexValueResponse
  release: ComplexValueResponse
  level: ComplexValueResponse
  volume: ComplexValueResponse
}

export interface OperativeValueResponse {
  name: string
  income: {
    category: string
    date: string
    value: number
  }[]
  release: {
    category: string
    date: string
    value: number
  }[]
  level: {
    category: string
    date: string
    value: number
  }[]
  volume: {
    category: string
    date: string
    value: number
  }[]
}
