import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  PlayIcon,
} from '@heroicons/react/24/solid'
import Select from '@/app/components/base/select'
import type { PromptConfig, AppInfo } from '@/types/app'
import Button from '@/app/components/base/button'
import { DEFAULT_VALUE_MAX_LEN } from '@/config'

export type IConfigSenceProps = {
  appInfo: AppInfo
  promptConfig: PromptConfig
  inputs: Record<string, any>
  onInputsChange: (inputs: Record<string, any>) => void
  query: string
  onQueryChange: (query: string) => void
  onSend: () => void
}
const ConfigSence: FC<IConfigSenceProps> = ({
  appInfo,
  promptConfig,
  inputs,
  onInputsChange,
  query,
  onQueryChange,
  onSend,
}) => {
  const { t } = useTranslation()

  return (
    <div className="shrink-0 w-1/2 px-10 py-8">
      <section>
        {/* title & description */}
        <div className='text-2xl font-bold text-gray-800'>👏 {t('app.common.welcome')} {appInfo.title}</div>
        <div className='mt-2 text-gray-400 font-semi-bold'>{appInfo.description}</div>
      </section>
      <section>
        {/* input form */}
        <form>
          {promptConfig.prompt_variables.map(item => (
            <div className='w-full mt-4 inline-flex' key={item.key}>
              <label className='shrink-0 mr-2 mt-2 text-gray-900 text-sm font-normal  w-[120px] leading-4'>{item.name}</label>
              {item.type === 'select' ? (
                <Select
                  className='w-full'
                  defaultValue={inputs[item.key]}
                  onSelect={(i) => { onInputsChange({ ...inputs, [item.key]: i.value }) }}
                  items={(item.options || []).map(i => ({ name: i, value: i }))}
                  allowSearch={false}
                  bgClassName='bg-gray-50'
                />
              ) : (
                <input
                  type="text"
                  className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-xs focus:ring-blue-500 focus:border-blue-500 "
                  value={inputs[item.key]}
                  onChange={(e) => { onInputsChange({ ...inputs, [item.key]: e.target.value }) }}
                  maxLength={item.max_length || DEFAULT_VALUE_MAX_LEN}
                />
              )}
            </div>
          ))}
          <div className='w-full mt-4 inline-flex '>
            <label className='shrink-0 mr-2 mt-2 text-sm text-gray-900 font-normal w-[120px] leading-4'>{t('app.generation.queryTitle')}</label>
            <div className="w-full mb-4 overflow-hidden border border-gray-200 rounded-lg bg-gray-50 ">
              <div className="px-4 py-2 bg-gray-50 rounded-t-lg">
                <textarea
                  value={query}
                  onChange={(e) => { onQueryChange(e.target.value) }}
                  rows={4}
                  className="w-full px-0 text-sm text-gray-900 bg-gray-50 border-0 focus:outline-none placeholder:bg-gray-50" placeholder={t('app.generation.queryPlaceholder') as string}
                  required
                >
                </textarea>
              </div>
              <div className="flex items-center justify-between px-3 py-2 border-t bg-gray-50">
                <div className="flex pl-0 space-x-1 sm:pl-2">
                  <span className="bg-gray-100 text-gray-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded cursor-pointer">{query.length}</span>
                </div>
                <Button
                  type="default"
                  className='text-primary-600'
                  onClick={onSend}
                >
                  <PlayIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                  {t('app.generation.run')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
export default React.memo(ConfigSence)
