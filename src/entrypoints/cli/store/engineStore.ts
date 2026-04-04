import { create } from 'zustand'
import type Engine from '../../../runtime/engine'

interface EngineStore {
  modelName: string
  contextWindow: number | undefined
}

let _engine: Engine

export function initEngine(engine: Engine, modelName: string) {
  _engine = engine
  useEngineStore.setState({ modelName, contextWindow: engine.getContextWindow() })
}

export function getEngine(): Engine {
  if (!_engine) throw new Error('Engine not initialized')
  return _engine
}

export const useEngineStore = create<EngineStore>(() => ({
  modelName: '',
  contextWindow: undefined,
}))
