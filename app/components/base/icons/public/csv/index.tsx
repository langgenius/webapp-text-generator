import * as React from 'react'
import data from './data.json'
import IconBase from '@/app/components/base/icons/IconBase'
import type { IconBaseProps } from '@/app/components/base/icons/IconBase'

const Icon = React.forwardRef<React.MutableRefObject<SVGElement>, Omit<IconBaseProps, 'data'>>((
  props,
  ref,
) => <IconBase {...props} ref={ref} data={data as any} />)

Icon.displayName = 'Csv'

export default Icon