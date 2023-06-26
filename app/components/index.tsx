'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import cn from 'classnames'
import { useBoolean, useClickAway } from 'ahooks'
import { XMarkIcon } from '@heroicons/react/24/outline'
import ConfigScence from './config-scence'
import NoData from './no-data'
import TextGenerationRes from './result'
import Button from './base/button'
import s from './style.module.css'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import { fetchAppParams, sendCompletionMessage, updateFeedback } from '@/service'
import Toast from '@/app/components/base/toast'
import type { Feedbacktype, PromptConfig } from '@/types/app'
import { changeLanguage } from '@/i18n/i18next-config'
import Loading from '@/app/components/base/loading'
import AppUnavailable from '@/app/components/app-unavailable'
import { API_KEY, APP_ID, APP_INFO } from '@/config'
import { userInputsFormToPromptVariables } from '@/utils/prompt'

const TextGeneration = () => {
  const { t } = useTranslation()

  const media = useBreakpoints()
  const isPC = media === MediaType.pc
  const isTablet = media === MediaType.tablet
  const isMoble = media === MediaType.mobile

  /*
  * app info
  */
  const hasSetAppConfig = APP_ID && API_KEY
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknwonReason, setIsUnknwonReason] = useState<boolean>(false)

  const [inputs, setInputs] = useState<Record<string, any>>({})
  const [promptConfig, setPromptConfig] = useState<PromptConfig | null>(null)
  const [isResponsing, { setTrue: setResponsingTrue, setFalse: setResponsingFalse }] = useBoolean(false)
  const [completionRes, setCompletionRes] = useState('')
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
    const prompt_variables = promptConfig?.prompt_variables
    if (!prompt_variables || prompt_variables?.length === 0)
      return true

    let hasEmptyInput = false
    const requiredVars = prompt_variables?.filter(({ key, name, required }) => {
      const res = (!key || !key.trim()) || (!name || !name.trim()) || (required || required === undefined || required === null)
      return res
    }) || [] // compatible with old version
    requiredVars.forEach(({ key }) => {
      if (hasEmptyInput)
        return

      if (!inputs[key])
        hasEmptyInput = true
    })

    if (hasEmptyInput) {
      logError(t('app.errorMessage.valueOfVarRequired'))
      return false
    }
    return !hasEmptyInput
  }

  const handleSend = async () => {
    if (isResponsing) {
      notify({ type: 'info', message: t('app.errorMessage.waitForResponse') })
      return false
    }

    if (!checkCanSend())
      return

    const data = {
      inputs,
    }

    setMessageId(null)
    setFeedback({
      rating: null,
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
      },
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

        const { user_input_form }: any = await fetchAppParams()
        const prompt_variables = userInputsFormToPromptVariables(user_input_form).map(item => ({
          ...item,
          type: 'paragraph',
        }))

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
      document.title = `${APP_INFO.title} - Powered by Dify`
  }, [APP_INFO?.title])

  const [isShowResSidebar, { setTrue: showResSidebar, setFalse: hideResSidebar }] = useBoolean(false)
  const resRef = useRef<HTMLDivElement>(null)
  useClickAway(() => {
    hideResSidebar()
  }, resRef)

  const renderRes = (
    <div
      ref={resRef}
      className={
        cn('flex flex-col h-full shrink-0',
          isPC ? 'px-10 py-8' : 'bg-gray-50',
          isTablet && 'p-6', isMoble && 'p-4')}
    >
      <>
        <div className='shrink-0 flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className={s.starIcon}></div>
            <div className='text-lg text-gray-800 font-semibold'>{t('app.generation.title')}</div>
          </div>
          {!isPC && (
            <div
              className='flex items-center justify-center cursor-pointer'
              onClick={hideResSidebar}
            >
              <XMarkIcon className='w-4 h-4 text-gray-800' />
            </div>
          )}
        </div>

        <div className='grow'>
          {(isResponsing && !completionRes)
            ? (
              <div className='flex h-full w-full justify-center items-center'>
                <Loading type='area' />
              </div>)
            : (
              <>
                {isNoData
                  ? <NoData />
                  : (
                    <TextGenerationRes
                      className='mt-3'
                      content={completionRes}
                      messageId={messageId}
                      isInWebApp
                      onFeedback={handleFeedback}
                      feedback={feedback}
                      isMobile={isMoble}
                    />
                  )
                }
              </>
            )}
        </div>
      </>
    </div>
  )

  if (appUnavailable)
    return <AppUnavailable isUnknwonReason={isUnknwonReason} errMessage={!hasSetAppConfig ? 'Please set APP_ID and API_KEY in config/index.tsx' : ''} />

  if (!APP_INFO || !promptConfig)
    return <Loading type='app' />

  return (
    <>
      <div className={cn(isPC && 'flex', 'h-screen bg-gray-50')}>
        {/* Left */}
        <div className={cn(isPC ? 'w-[600px] max-w-[50%] p-8' : 'p-4', 'shrink-0 relative flex flex-col pb-10 h-full border-r border-gray-100 bg-white')}>
          <div className='mb-6'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center space-x-3'>
                <div className={cn(s.appIcon, 'shrink-0')}></div>
                <div className='text-lg text-gray-800 font-semibold'>{APP_INFO.title}</div>
              </div>
              {!isPC && (
                <Button
                  className='shrink-0 !h-8 !px-3'
                  onClick={showResSidebar}
                >
                  <div className='flex items-center space-x-2 text-primary-600 text-[13px] font-medium'>
                    <div className={s.starIcon}></div>
                    <span>{t('app.generation.title')}</span>
                  </div>
                </Button>
              )}
            </div>
            {APP_INFO.description && (
              <div className='mt-2 text-xs text-gray-500'>{APP_INFO.description}</div>
            )}
          </div>

          <div className='grow h-20 overflow-y-auto'>
            <ConfigScence
              inputs={inputs}
              onInputsChange={setInputs}
              promptConfig={promptConfig}
              onSend={handleSend}
            />
          </div>

          {/* copyright */}
          <div className='fixed left-8 bottom-4  flex space-x-2 text-gray-400 font-normal text-xs'>
            <div className="">© {APP_INFO.copyright || APP_INFO.title} {(new Date()).getFullYear()}</div>
            {APP_INFO.privacy_policy && (
              <>
                <div>·</div>
                <div>{t('app.generation.privacyPolicyLeft')}
                  <a
                    className='text-gray-500'
                    href={APP_INFO.privacy_policy}
                    target='_blank'>{t('app.generation.privacyPolicyMiddle')}</a>
                  {t('app.generation.privacyPolicyRight')}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Result */}
        {isPC && (
          <div className='grow h-full'>
            {renderRes}
          </div>
        )}

        {(!isPC && isShowResSidebar) && (
          <div
            className={cn('fixed z-50 inset-0', isTablet ? 'pl-[128px]' : 'pl-6')}
            style={{
              background: 'rgba(35, 56, 118, 0.2)',
            }}
          >
            {renderRes}
          </div>
        )}
      </div>
    </>
  )
}

export default TextGeneration
