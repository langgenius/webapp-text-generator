'use client'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBoolean } from 'ahooks'
import Header from './header'
import ConfigScence from './config-scence'
import NoData from './no-data'
import Result from './result'
import { fetchAppParams, sendCompletionMessage, updateFeedback } from '@/service'
import Toast from '@/app/components/base/toast'
import { Feedbacktype, PromptConfig } from '@/types/app'
import { changeLanguage } from '@/i18n/i18next-config'
import Loading from '@/app/components/base/loading'
import AppUnavailable from '@/app/components/app-unavailable'
import { APP_ID, API_KEY, APP_INFO } from '@/config'

const TextGeneration = () => {
  const { t } = useTranslation()

  /*
  * app info
  */
  const hasSetAppConfig = APP_ID && API_KEY
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknwonReason, setIsUnknwonReason] = useState<boolean>(false)

  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [isResponsing, { setTrue: setResponsingTrue, setFalse: setResponsingFalse }] = useBoolean(false)
  const [query, setQuery] = useState('')
  const [completionRes, setCompletionRes] = useState('')
  const { notify } = Toast
  const isNoData = !completionRes
  const [messageId, setMessageId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedbacktype>({
    rating: null
  })

  const handleFeedback = async (feedback: Feedbacktype) => {
    await updateFeedback({ url: `/messages/${messageId}/feedbacks`, body: { rating: feedback.rating } })
    setFeedback(feedback)
  }

  const logError = (message: string) => {
    notify({ type: 'error', message })
  }

  const checkCanSend = () => {
    const inputLens = Object.values(inputs).length
    const promptVariablesLens = promptConfig?.prompt_variables.length || 0

    const emytyInput = inputLens < promptVariablesLens || Object.values(inputs).find(v => !v)
    if (emytyInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return true
  }

  const handleSend = async () => {
    if (isResponsing) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return false
    }

    if (!checkCanSend())
      return

    if (!query) {
      logError(t('app.errorMessage.queryRequired'))
      return false
    }


    const data = {
      inputs,
      query,
    }

    setMessageId(null)
    setFeedback({
      rating: null
    })
    setCompletionRes('')

    const res: string[] = []
    let tempMessageId = ''

    setResponsingTrue()
    sendCompletionMessage(data, {
      onData: (data: string, _isFirstMessage: boolean, { messageId }: any) => {
        tempMessageId = messageId
        res.push(data)
        setCompletionRes(res.join(''))
      },
      onCompleted: () => {
        setResponsingFalse()
        setMessageId(tempMessageId)
      },
      onError() {
        setResponsingFalse()
      }
    })
  }

  useEffect(() => {
    if (!hasSetAppConfig) {
      setAppUnavailable(true)
      return
    }
    (async () => {
      try {

        changeLanguage(APP_INFO.default_language)

        const { variables: prompt_variables }: any = await fetchAppParams()

        setPromptConfig({
          prompt_template: '',
          prompt_variables,
        } as PromptConfig)
      }
      catch (e: any) {
        if (e.status === 404) {
          setAppUnavailable(true)
        }
        else {
          setIsUnknwonReason(true)
          setAppUnavailable(true)
        }
      }
    })()
  }, [])

  useEffect(() => {
    if (APP_INFO?.title)
      document.title = `${APP_INFO.title} - Powered by LangGenius`
  }, [APP_INFO?.title])

  if (appUnavailable)
    return <AppUnavailable isUnknwonReason={isUnknwonReason} errMessage={!hasSetAppConfig ? 'Please set APP_ID and API_KEY in config/index.tsx' : ''} />

  if (!APP_INFO || !promptConfig)
    return <Loading type='app' />


  return (
    <>
      <div className='flex flex-col h-screen'>
        <Header title={APP_INFO.title} />
        <div className="flex grow">
          <ConfigScence
            appInfo={APP_INFO}
            inputs={inputs}
            onInputsChange={setInputs}
            promptConfig={promptConfig}
            query={query}
            onQueryChange={setQuery}
            onSend={handleSend}
          />

          <div className="flex w-1/2 h-full px-10 py-8 shrink-0">
            {isNoData
              ? <NoData />
              : (
                <div className='flex flex-col w-full h-full'>
                  <Result showFeedback={!!messageId} content={completionRes} feedback={feedback} onFeedback={handleFeedback} />
                  {/* <History dictionary={dictionary} /> */}
                </div>)
            }
          </div>
        </div>
      </div>
    </>
  )
}

export default TextGeneration
