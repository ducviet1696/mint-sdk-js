import React from 'react'
import styled from '@emotion/styled'
import { ItemLog, NetworkId } from '@kyuzan/mint-sdk-js'
import { format } from 'date-fns'
import { color, curve, font, media } from '../../../style'
import { DefaultAvatarIcon } from '../../atoms/DefaultAvatarIcon'
import { LoadingHistoryCard } from './loading'
import Link from 'next/link'
import { Anchor } from '../../atoms/Anchor'

type Props = {
  log?: ItemLog & { avatarImgUrl?: string }
  networkId?: NetworkId
  loading: boolean
}

export const HistoryCard: React.FC<Props> = ({ log, networkId, loading }) => {
  if (loading) return <LoadingHistoryCard />
  if (!log) return <LoadingHistoryCard />
  const price = log?.price
  const date = format(new Date(log.createAt), 'yyyy/MM/dd HH:mm')
  const link = getLink(log.transactionHash, networkId)

  return (
    <HistoryContainer>
      <Link href={`/accounts/${log.accountAddress}`} passHref>
        <Anchor>
          <Avatar>
            {log.avatarImgUrl ? (
              <AvatarImage src={log.avatarImgUrl} />
            ) : (
              <DefaultAvatarIcon size={44} name={log.accountAddress} />
            )}
          </Avatar>
        </Anchor>
      </Link>

      <BidderDetail>
        <BidderId>{log.accountAddress}</BidderId>
        <BidTime>{date}</BidTime>
      </BidderDetail>
      <Link href={link} passHref>
        <Anchor target={'_blank'}>
          <BidPrice>
            {price} ETH
            <Icon />
          </BidPrice>
        </Anchor>
      </Link>
    </HistoryContainer>
  )
}

export const HistoryContainer = styled.div`
  /* width: 426px; */
  /* height: 70px; */
  padding: 8px 16px 8px 16px;
  justify-content: space-between;
  align-items: center;
  display: flex;
  background: ${color.white};
  border-radius: 4px;
  text-decoration: none;
  box-shadow: 0px 9px 16px rgba(0, 0, 0, 0.04),
    0px 2.01027px 3.57381px rgba(0, 0, 0, 0.0238443),
    0px 0.598509px 1.06402px rgba(0, 0, 0, 0.0161557);
  ${curve.fade}

  &:hover {
    box-shadow: 0px 22px 43px rgba(0, 0, 0, 0.08),
      0px 4.91399px 9.60461px rgba(0, 0, 0, 0.0476886),
      0px 1.46302px 2.85954px rgba(0, 0, 0, 0.0323114);
  }
`

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  margin: 4.5px 16px 4.5px 0;
  object-fit: cover;
  border-radius: 50%;
  overflow: hidden;
  opacity: 1;
  ${curve.button}
  &:hover {
    opacity: 0.82;
  }
  &:active {
    opacity: 1;
  }
`

export const BidderDetail = styled.div`
  max-width: 200px;
  overflow-wrap: break-word;
  ${media.sp`
    overflow-wrap: anywhere;
  `}
`
export const BidderId = styled.div`
  ${font.mont.caption}
`
export const BidTime = styled.div`
  padding: 4px 0 0 0;
  ${font.mont.caption}
  color: ${color.content.gray1};
`
export const BidPrice = styled.div`
  min-width: 100px;
  ${font.mont.subtitle1}
  justify-content: flex-end;
  display: flex;
  margin: auto;
  opacity: 1;
  ${curve.button}
  &:hover {
    opacity: 0.72;
  }
  &:active {
    opacity: 1;
  }
`
export const Icon = styled.span`
  &:after {
    text-align: center;
    margin-left: 4px;
    margin-bottom: 3px;
    font-family: 'icomoon';
    color: ${color.content.middle};
    content: '\\e904';
    ${curve.button}
  }
`

const AvatarImage = styled.img`
  height: 100%;
  width: 100%;
  object-fit: cover;
`

const getLink = (hash: string, networkId?: NetworkId) => {
  if (networkId === 1) {
    return `https://etherscan.io/tx/${hash}`
  }

  if (networkId === 4) {
    return `https://rinkeby.etherscan.io/tx/${hash}`
  }

  if (networkId === 137) {
    return `https://explorer-mainnet.maticvigil.com/tx/${hash}`
  }

  if (networkId === 80001) {
    return `https://explorer-mumbai.maticvigil.com/tx/${hash}`
  }

  return ''
}
