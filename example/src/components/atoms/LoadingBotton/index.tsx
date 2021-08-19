import styled from '@emotion/styled'
import Image from 'next/image'
import React from 'react'
import { color, font } from '../../../style'

type Props = {
  isLoading: boolean
  label: string
  disabled?: boolean
  className?: string
  onClick?: () => any
}

export const PrimaryLoadingButton: React.FC<Props> = ({
  label,
  onClick,
  isLoading,
  className,
  disabled,
}) => {
  if (disabled) {
    return (
      <Disabled onClick={onClick} className={className} disabled>
        {label}
      </Disabled>
    )
  }
  return (
    <Primary onClick={onClick} className={className}>
      {isLoading && (
        <Image
          src={'/images/spinner_white.svg'}
          width={24}
          layout={'fixed'}
          height={24}
        />
      )}

      {label}
    </Primary>
  )
}

export const PrimaryLoadingButtonSubmit: React.FC<Props> = ({
  label,
  onClick,
  isLoading,
  className,
}) => {
  return (
    <SubmitBase
      onClick={onClick}
      className={className}
      type={'submit'}
      value={isLoading ? '...' : label}
    />
  )
}

const SubmitBase = styled.input`
  cursor: pointer;
  ${font.mont.button}
  height: 44px;
  line-height: 44px;
  border-radius: 22px;
  color: ${color.white};
  width: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 32px;
  background-color: ${color.primary};
  border: none;
`

const ButtonBase = styled.button`
  cursor: pointer;
  ${font.mont.button}
  height: 44px;
  line-height: 44px;
  border-radius: 22px;
  color: ${color.white};
  width: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 32px;
  border: 0;
`

// const Primary = styled(ButtonBase)`
//   background-color: ${color.primary};
// `

const Primary = styled(ButtonBase)`
  background-color: ${color.primary};
`

const Disabled = styled(ButtonBase)`
  background-color: ${color.content.superLight};
  color: ${color.content.middle};
  border-radius: 0px;
  cursor: not-allowed;
`