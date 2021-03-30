import styled from '@emotion/styled'
import Image from 'next/image'
import React from 'react'
import { color, font } from '../../../style/idnex'

type Props = {
  isLoading: boolean
  label: string
  onClick: () => any
}

export const PrimaryButton: React.FC<Props> = ({
  label,
  onClick,
  isLoading,
}) => {
  return (
    <Primary onClick={onClick}>
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

const ButtonBase = styled.div`
  cursor: pointer;
  ${font.lg.button}
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
`

const Primary = styled(ButtonBase)`
  background-color: ${color.primary};
`
