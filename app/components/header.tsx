import type { FC } from 'react'
import React from 'react'
import { PencilSquareIcon } from '@heroicons/react/24/solid'

export type IHeaderProps = {
  title: string
  isMobile?: boolean
  onCreateNewChat?: () => void
}

const Header: FC<IHeaderProps> = ({
  title,
  isMobile,
  onCreateNewChat,
}) => {
  return (
    <div className="shrink-0 flex items-center justify-between h-12 px-3 bg-gray-900 text-white">
      <div className='flex items-center space-x-2'>
        <div className="text-sm font-bold">Axys - Assistente de Diferenciação</div>
      </div>
      {isMobile && (
        <div className='flex items-center justify-center h-8 w-8 cursor-pointer'
          onClick={() => onCreateNewChat?.()}
        >
          <PencilSquareIcon className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  )
}

export default React.memo(Header)
