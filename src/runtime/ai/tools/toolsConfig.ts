import { tool } from 'ai'
import type { LanguageModel, ToolSet } from 'ai'
import type BaseTool from './BaseTool'

import bashTool from './bash/bash.tool'
import readTool from './read/read.tool'
import writeTool from './write/write.tool'
import editTool from './edit/edit.tool'
import multieditTool from './multiedit/multiedit.tool'
import globTool from './glob/glob.tool'
import grepTool from './grep/grep.tool'
import lsTool from './ls/ls.tool'
import webfetchTool from './webfetch/webfetch.tool'
import { todoWriteTool, todoReadTool } from './todo/todo.tool'
import applyPatchTool from './apply_patch/apply_patch.tool'
import codesearchTool from './codesearch/codesearch.tool'
import websearchTool from './websearch/websearch.tool'
import lspTool from './lsp/lsp.tool'
import questionTool from './question/question.tool'
import planTool from './plan/plan.tool'
import taskTool from './task/task.tool'
import { createBatchTool } from './batch/batch.tool'

class ToolsConfig {
  public tools: ToolSet

  constructor(model: LanguageModel) {
    const base: BaseTool[] = [
      bashTool,
      readTool,
      writeTool,
      editTool,
      multieditTool,
      globTool,
      grepTool,
      lsTool,
      webfetchTool,
      todoWriteTool,
      todoReadTool,
      applyPatchTool,
      codesearchTool,
      websearchTool,
      lspTool,
      questionTool,
      planTool,
      taskTool,
    ]

    const baseTools: ToolSet = Object.fromEntries(
      base.map(t => [
        t.name,
        tool({
          description: t.description,
          inputSchema: t.parameters,
          execute: t.execute.bind(t),
        }),
      ]),
    )

    taskTool.configure(model, baseTools)

    const batchTool = createBatchTool(baseTools)
    this.tools = {
      ...baseTools,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [batchTool.name]: tool(batchTool as any),
    }
  }
}

export default ToolsConfig
