'use client'
import type { FC } from 'react'
import React from 'react'
import {
  useCSVDownloader,
} from 'react-papaparse'
import { useTranslation } from 'react-i18next'
import Download02 from '@/app/components/base/icons/solid/download-02'

export type ICSVDownloadProps = {
  vars: { name: string }[]
}

const CSVDownload: FC<ICSVDownloadProps> = ({
  vars,
}) => {
  const { t } = useTranslation()
  const { CSVDownloader, Type } = useCSVDownloader()
  const addQueryContentVars = [...vars]
  const template = (() => {
    const res: Record<string, string> = {}
    addQueryContentVars.forEach((item) => {
      res[item.name] = ''
    })
    return res
  })()

  return (
    <div className='mt-6'>
      <div className='text-sm text-gray-900 font-medium'>{t('app.generation.csvStructureTitle')}</div>
      <div className='mt-2 max-h-[500px] overflow-auto'>
        <table className='w-full border-separate border-spacing-0 border border-gray-200 rounded-lg text-xs'>
          <thead className='text-gray-500'>
            <tr>
              {addQueryContentVars.map((item, i) => (
                <td key={i} className='h-9 pl-4 border-b border-gray-200'>{item.name}</td>
              ))}
            </tr>
          </thead>
          <tbody className='text-gray-300'>
            <tr>
              {addQueryContentVars.map((item, i) => (
                <td key={i} className='h-9 pl-4'>{item.name} {t('app.generation.field')}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <CSVDownloader
        className="block mt-2 cursor-pointer"
        type={Type.Link}
        filename={'template'}
        bom={true}
        config={{
          // delimiter: ';',
        }}
        data={[
          template,
        ]}
      >
        <div className='flex items-center h-[18px] space-x-1 text-[#155EEF] text-xs font-medium'>
          <Download02 className='w-3 h-3' />
          <span>{t('app.generation.downloadTemplate')}</span>
        </div>
      </CSVDownloader>
    </div>

  )
}
export default React.memo(CSVDownload)
