import { create } from 'zustand'
import type Engine from '../../../runtime/engine'

interface EngineStore {
  modelName: string
}

let _engine: Engine

export function initEngine(engine: Engine, modelName: string) {
  _engine = engine
  useEngineStore.setState({ modelName })
}

export function getEngine(): Engine {
  if (!_engine) throw new Error('Engine not initialized')
  return _engine
}

export const useEngineStore = create<EngineStore>(() => ({
  modelName: '',
}))
