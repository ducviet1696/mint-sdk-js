import styled from '@emotion/styled'
import React from 'react'

type Props = {
  text: string
  value: boolean
  onChange?: () => void
}

export const Checkbox: React.VFC<Props> = ({ text, value, onChange }) => {
  return (
    <Container>
      <Input type="checkbox" checked={value} onChange={onChange} />
      {text}
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  align-items: center;
  height: 21px;
  padding: 2px 0px;
`

const Input = styled.input`
  width: 16px;
  height: 16px;
  margin: 2px 6px 2px 2px;
`
