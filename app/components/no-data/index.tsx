import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

export type INoDataProps = {}
const NoData: FC<INoDataProps> = () => {
  const { t } = useTranslation()
  return (
    <div className='flex flex-col h-full w-full justify-center items-center'>
      <DocumentTextIcon className='text-gray-300 w-12 h-12 mb-3' />
      <div
        className='text-gray-300 text-xs leading-3'
      >
        {t('app.generation.noData')}
      </div>
    </div>
  )
}
export default React.memo(NoData)
