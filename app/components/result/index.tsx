import type { FC } from 'react'
import React from 'react'
import Header from './header'
import type { Feedbacktype } from '@/types/app'
import { Markdown } from '@/app/components/base/markdown'

export type IResultProps = {
  content: string
  showFeedback: boolean
  feedback: Feedbacktype
  onFeedback: (feedback: Feedbacktype) => void
}
const Result: FC<IResultProps> = ({
  content,
  showFeedback,
  feedback,
  onFeedback
}) => {
  return (
    <div className='basis-3/4 h-max'>
      <Header result={content} showFeedback={showFeedback} feedback={feedback} onFeedback={onFeedback} />
      <div
        className='mt-4 w-full flex text-sm leading-5 overflow-scroll font-normal text-gray-900'
        style={{
          maxHeight: '70vh'
        }}
      >
        <Markdown content={content} />
      </div>
    </div>
  )
}
export default React.memo(Result)
