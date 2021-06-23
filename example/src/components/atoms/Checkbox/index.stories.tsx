import React, { useCallback, useState } from 'react'
import { Checkbox } from '.'

export const Basic: React.VFC = () => {
  const [checked, setChecked] = useState(false)
  const onChange = useCallback(() => {
    setChecked((prev) => !prev)
  }, [])
  return (
    <Checkbox
      text="私は日本に在住しています。"
      value={checked}
      onChange={onChange}
    />
  )
}

export default {
  title: 'atoms/Checkbox',
}
