'use client'
import type { FC } from 'react'
import React, { useEffect, useRef, useState } from 'react'
import { useBoolean } from 'ahooks'
import { t } from 'i18next'
import cn from 'classnames'
import NoData from '../no-data'
import TextGenerationRes from './item'
import Toast from '@/app/components/base/toast'
import { sendCompletionMessage, updateFeedback } from '@/service'
import type { Feedbacktype, PromptConfig, VisionFile, VisionSettings } from '@/types/app'
import { TransferMethod } from '@/types/app'
import Loading from '@/app/components/base/loading'
export type IResultProps = {
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
    const startTime = Date.now()
    let isTimeout = false
    const runId = setInterval(() => {
      if (Date.now() - startTime > 1000 * 60) { // 1min timeout
        clearInterval(runId)
        setResponsingFalse()
        onCompleted(getCompletionRes(), taskId, false)
        isTimeout = true
        console.log(`[#${taskId}]: timeout`)
      }
    }, 1000)
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
        clearInterval(runId)
      },
      onError() {
        if (isTimeout)
          return

        setResponsingFalse()
        onCompleted(getCompletionRes(), taskId, false)
        clearInterval(runId)
      },
    })
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
              {isNoData
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
