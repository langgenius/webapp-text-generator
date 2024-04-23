'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { useBoolean } from 'ahooks'
import { t } from 'i18next'
import produce from 'immer'
import cn from 'classnames'
import NoData from '../no-data'
import TextGenerationRes from './item'
import Toast from '@/app/components/base/toast'
import { sendCompletionMessage, sendWorkflowMessage, updateFeedback } from '@/service'
import type { Feedbacktype, PromptConfig, VisionFile, VisionSettings, WorkflowProcess } from '@/types/app'
import { NodeRunningStatus, TransferMethod, WorkflowRunningStatus } from '@/types/app'
import Loading from '@/app/components/base/loading'
import { sleep } from '@/utils'

export type IResultProps = {
  isWorkflow: boolean
  isCallBatchAPI: boolean
  isPC: boolean
  isMobile: boolean
  isError: boolean
  promptConfig: PromptConfig | null
  inputs: Record<string, any>
  controlSend?: number
  controlRetry?: number
  controlStopResponding?: number
  onShowRes: () => void
  taskId?: number
  onCompleted: (completionRes: string, taskId?: number, success?: boolean) => void
  visionConfig: VisionSettings
  completionFiles: VisionFile[]
}

const Result: FC<IResultProps> = ({
  isWorkflow,
  isCallBatchAPI,
  isPC,
  isMobile,
  isError,
  promptConfig,
  inputs,
  controlSend,
  controlRetry,
  controlStopResponding,
  onShowRes,
  taskId,
  onCompleted,
  visionConfig,
  completionFiles,
}) => {
  const [isResponsing, { setTrue: setResponsingTrue, setFalse: setResponsingFalse }] = useBoolean(false)
  useEffect(() => {
    if (controlStopResponding)
      setResponsingFalse()
  }, [controlStopResponding])

  const [completionRes, doSetCompletionRes] = useState('')
  const completionResRef = useRef('')
  const setCompletionRes = (res: string) => {
    completionResRef.current = res
    doSetCompletionRes(res)
  }
  const getCompletionRes = () => completionResRef.current
  const [workflowProcessData, doSetWorkflowProccessData] = useState<WorkflowProcess>()
  const workflowProcessDataRef = useRef<WorkflowProcess>()
  const setWorkflowProccessData = (data: WorkflowProcess) => {
    workflowProcessDataRef.current = data
    doSetWorkflowProccessData(data)
  }
  const getWorkflowProccessData = () => workflowProcessDataRef.current

  const { notify } = Toast
  const isNoData = !completionRes

  const [messageId, setMessageId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedbacktype>({
    rating: null,
  })

  const handleFeedback = async (feedback: Feedbacktype) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: { rating: feedback.rating } })
    setFeedback(feedback)
  }

  const logError = (message: string) => {
    notify({ type: 'error', message })
  }

  const checkCanSend = () => {
    // batch will check outer
    if (isCallBatchAPI)
      return true

    const prompt_variables = promptConfig?.prompt_variables
    if (!prompt_variables || prompt_variables?.length === 0)
      return true

    let hasEmptyInput = ''
    const requiredVars = prompt_variables?.filter(({ key, name, required }) => {
      const res = (!key || !key.trim()) || (!name || !name.trim()) || (required || required === undefined || required === null)
      return res
    }) || [] // compatible with old version
    requiredVars.forEach(({ key, name }) => {
      if (hasEmptyInput)
        return

      if (!inputs[key])
        hasEmptyInput = name
    })

    if (hasEmptyInput) {
      logError(t('appDebug.errorMessage.valueOfVarRequired', { key: hasEmptyInput }))
      return false
    }
    if (completionFiles.find(item => item.transfer_method === TransferMethod.local_file && !item.upload_file_id)) {
      notify({ type: 'info', message: t('appDebug.errorMessage.waitForImgUpload') })
      return false
    }
    return !hasEmptyInput
  }

  const handleSend = async () => {
    if (isResponsing) {
      notify({ type: 'info', message: t('appDebug.errorMessage.waitForResponse') })
      return false
    }

    if (!checkCanSend())
      return

    const data: Record<string, any> = {
      inputs,
    }
    if (visionConfig.enabled && completionFiles && completionFiles?.length > 0) {
      data.files = completionFiles.map((item) => {
        if (item.transfer_method === TransferMethod.local_file) {
          return {
            ...item,
            url: '',
          }
        }
        return item
      })
    }

    setMessageId(null)
    setFeedback({
      rating: null,
    })
    setCompletionRes('')

    const res: string[] = []
    let tempMessageId = ''

    if (!isPC)
      onShowRes()

    setResponsingTrue()
    let isEnd = false
    let isTimeout = false;
    (async () => {
      await sleep(1000 * 60) // 1min timeout
      if (!isEnd) {
        setResponsingFalse()
        onCompleted(getCompletionRes(), taskId, false)
        isTimeout = true
      }
    })()

    if (isWorkflow) {
      sendWorkflowMessage(
        data,
        {
          onWorkflowStarted: ({ workflow_run_id }) => {
            tempMessageId = workflow_run_id
            setWorkflowProccessData({
              status: WorkflowRunningStatus.Running,
              tracing: [],
              expand: false,
            })
            setResponsingFalse()
          },
          onNodeStarted: ({ data }) => {
            setWorkflowProccessData(produce(getWorkflowProccessData()!, (draft) => {
              draft.expand = true
              draft.tracing!.push({
                ...data,
                status: NodeRunningStatus.Running,
                expand: true,
              } as any)
            }))
          },
          onNodeFinished: ({ data }) => {
            setWorkflowProccessData(produce(getWorkflowProccessData()!, (draft) => {
              const currentIndex = draft.tracing!.findIndex(trace => trace.node_id === data.node_id)
              if (currentIndex > -1 && draft.tracing) {
                draft.tracing[currentIndex] = {
                  ...(draft.tracing[currentIndex].extras
                    ? { extras: draft.tracing[currentIndex].extras }
                    : {}),
                  ...data,
                  expand: !!data.error,
                } as any
              }
            }))
          },
          onWorkflowFinished: ({ data }) => {
            if (isTimeout)
              return
            if (data.error) {
              notify({ type: 'error', message: data.error })
              setResponsingFalse()
              onCompleted(getCompletionRes(), taskId, false)
              isEnd = true
              return
            }
            setWorkflowProccessData(produce(getWorkflowProccessData()!, (draft) => {
              draft.status = data.error ? WorkflowRunningStatus.Failed : WorkflowRunningStatus.Succeeded
            }))
            if (!data.outputs)
              setCompletionRes('')
            else if (Object.keys(data.outputs).length > 1)
              setCompletionRes(data.outputs)
            else
              setCompletionRes(data.outputs[Object.keys(data.outputs)[0]])
            setResponsingFalse()
            setMessageId(tempMessageId)
            onCompleted(getCompletionRes(), taskId, true)
            isEnd = true
          },
        },
      )
    }
    else {
      sendCompletionMessage(data, {
        onData: (data: string, _isFirstMessage: boolean, { messageId }) => {
          tempMessageId = messageId
          res.push(data)
          setCompletionRes(res.join(''))
        },
        onCompleted: () => {
          if (isTimeout)
            return

          setResponsingFalse()
          setMessageId(tempMessageId)
          onCompleted(getCompletionRes(), taskId, true)
          isEnd = true
        },
        onError() {
          if (isTimeout)
            return

          setResponsingFalse()
          onCompleted(getCompletionRes(), taskId, false)
          isEnd = true
        },
      })
    }
  }

  useEffect(() => {
    if (controlSend)
      handleSend()
  }, [controlSend])

  useEffect(() => {
    if (controlRetry)
      handleSend()
  }, [controlRetry])

  const renderTextGenerationRes = () => (
    <TextGenerationRes
      isWorkflow={isWorkflow}
      workflowProcessData={workflowProcessData}
      className='mt-3'
      isError={isError}
      onRetry={handleSend}
      content={completionRes}
      messageId={messageId}
      isInWebApp
      onFeedback={handleFeedback}
      feedback={feedback}
      isMobile={isMobile}
      isLoading={isCallBatchAPI ? (!completionRes && isResponsing) : false}
      taskId={isCallBatchAPI ? ((taskId as number) < 10 ? `0${taskId}` : `${taskId}`) : undefined}
    />
  )

  return (
    <div className={cn(isNoData && !isCallBatchAPI && 'h-full')}>
      {!isCallBatchAPI && (
        (isResponsing && !completionRes)
          ? (
            <div className='flex h-full w-full justify-center items-center'>
              <Loading type='area' />
            </div>)
          : (
            <>
              {(isNoData && !workflowProcessData)
                ? <NoData />
                : renderTextGenerationRes()
              }
            </>
          )
      )}
      {isCallBatchAPI && (
        <div className='mt-2'>
          {renderTextGenerationRes()}
        </div>
      )}
    </div>
  )
}
export default React.memo(Result)
