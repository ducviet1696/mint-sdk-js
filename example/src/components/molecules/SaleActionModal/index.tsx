import styled from '@emotion/styled'
import React, { useCallback, useState } from 'react'
import Image from 'next/image'
import Modal, { Styles } from 'react-modal'
import { color, font, media } from '../../../style'
import { PrimaryLoadingButton as ButtonBase } from '../../atoms/LoadingBotton'
import { Chip } from '../../atoms/Chip'
import { MediaContent } from '../../atoms/MediaContent'
import { StatusDetail } from '../Detail'
import { TransactionStatus } from '../../atoms/TransactionStatus'
import { SimpleButton } from '../../atoms/SimpleButton'
import { format, subMinutes } from 'date-fns'
import { Item } from '@kyuzan/mint-sdk-js'
import { Status } from '../../../redux/transaction'
import { ToolTip } from '../../atoms/ToolTip'
import { useMedia } from '../../../util/useMedia'

type Props = {
  item: Item | undefined
  endAt: Date
  price: number
  media: { url: string; mimeType: string } | undefined
  minBidPrice: number | undefined
  walletBalance: string | undefined
  isOpen: boolean
  closeModal: () => void
  loading: boolean
  unit: string
  bidPrice: string
  onChangeInput: React.ChangeEventHandler<HTMLInputElement>
  doBuy: (inJapan: boolean) => void
  doBid: () => void
  isValidationError?: boolean
  errorText?: string
  status?: Status
  bidHash?: string
}

const customStyles: Styles = {
  overlay: {
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    border: 'none',
    background: 'transparent',
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
}

export const SaleActionModal: React.VFC<Props> = ({
  closeModal,
  isOpen,
  loading,
  minBidPrice,
  walletBalance,
  unit,
  bidPrice,
  onChangeInput,
  doBid,
  doBuy,
  media,
  endAt,
  price,
  item,
  isValidationError,
  errorText,
  status,
  bidHash,
}) => {
  const isMobile = useMedia().isMobile
  return (
    <Modal
      isOpen={isOpen}
      style={customStyles}
      contentLabel="Wallet"
      ariaHideApp={false}
    >
      <ModalContainer>
        <Content>
          <Left>
            <MediaContainer>
              <MediaContent media={media} height={254} />
            </MediaContainer>
            <InfoContainer>
              <ItemName>{item?.name ?? ''}</ItemName>
              <StatusDetail
                endAt={endAt}
                price={price}
                unit={unit}
                tradeType={item?.tradeType ?? 'fixedPrice'}
              />
            </InfoContainer>
          </Left>
          <Right>
            {status === null && item?.tradeType === 'autoExtensionAuction' && (
              <AuctionSaleAction
                loading={loading}
                minBidPrice={minBidPrice}
                walletBalance={walletBalance}
                unit={unit}
                bidPrice={bidPrice}
                onChangeInput={onChangeInput}
                doBid={doBid}
                isValidationError={isValidationError}
                errorText={errorText}
              />
            )}
            {status === null && item?.tradeType === 'fixedPrice' && (
              <FixedSaleAction
                loading={loading}
                unit={unit}
                price={item.price}
                doBuy={doBuy}
                isValidationError={isValidationError}
                errorText={errorText}
              />
            )}
            {status === 'bidSuccess' && (
              <BidSuccessStatus item={item} endAt={endAt} bidHash={bidHash} />
            )}

            {status === 'buySuccess' && (
              <BuySuccessStatus item={item} hash={bidHash} />
            )}
          </Right>
        </Content>
        <CloseButton onClick={closeModal}>
          <Image
            src={'/images/close_button.svg'}
            width={isMobile ? 32 : 64}
            layout={'fixed'}
            height={isMobile ? 32 : 64}
          />
        </CloseButton>
      </ModalContainer>
    </Modal>
  )
}

const AuctionSaleAction: React.VFC<{
  minBidPrice: number | undefined
  walletBalance: string | undefined
  loading: boolean
  unit: string
  bidPrice: string
  onChangeInput: React.ChangeEventHandler<HTMLInputElement>
  doBid: () => void
  isValidationError?: boolean
  errorText?: string
}> = ({
  loading,
  minBidPrice,
  walletBalance,
  unit,
  bidPrice,
  onChangeInput,
  doBid,
  isValidationError,
  errorText,
}) => {
  const isMobile = useMedia().isMobile
  return (
    <>
      {!isMobile && <ContentTitle>入札する</ContentTitle>}
      <PriceRangeContainer>
        <PriceRangeItem>
          <PriceRangeTitle>MIN</PriceRangeTitle>
          <PriceRangeSubTitle>最低入札価格</PriceRangeSubTitle>
          <PriceRangePrice>
            {Math.ceil(parseFloat(`${minBidPrice}`) * 1000) / 1000}
            {unit}
          </PriceRangePrice>
        </PriceRangeItem>
        <ImageContainer>
          <Image
            src={'/images/arrows.svg'}
            width={32}
            height={16}
            layout={'fixed'}
          />
        </ImageContainer>
        <PriceRangeItem>
          <PriceRangeTitle>MAX</PriceRangeTitle>
          <PriceRangeSubTitle>所持金額</PriceRangeSubTitle>
          <PriceRangePrice>
            {Math.floor(parseFloat(`${walletBalance}`) * 1000) / 1000}
            {unit}
          </PriceRangePrice>
        </PriceRangeItem>
      </PriceRangeContainer>
      <InputPriceContainer>
        <InputPrice type={'number'} value={bidPrice} onChange={onChangeInput} />
        <InputUnit>{unit}</InputUnit>
      </InputPriceContainer>
      <ContentButtonContainer>
        {isValidationError && (
          <BidButton
            label={errorText ?? ''}
            isLoading={false}
            onClick={doBid}
            disabled={true}
          />
        )}
        {!isValidationError && (
          <BidButton
            label={loading ? '取引処理中です' : '入札する'}
            isLoading={loading}
            onClick={doBid}
          />
        )}
      </ContentButtonContainer>
    </>
  )
}

const FixedSaleAction: React.VFC<{
  price: number | undefined
  loading: boolean
  unit: string
  doBuy: (inJapan: boolean) => void
  isValidationError?: boolean
  errorText?: string
}> = ({ loading, unit, doBuy, isValidationError, errorText, price }) => {
  const [inJapan, setInJapan] = useState(false)
  return (
    <>
      <ContentTitle>購入を確定する</ContentTitle>
      <InputPriceContainer>
        <InputUnit>
          {price} {unit}
        </InputUnit>
      </InputPriceContainer>
      <CheckInJapanContainer>
        <label>
          <input
            type={'checkbox'}
            checked={inJapan}
            onChange={(e) => setInJapan(e.target.checked)}
          />{' '}
          私は日本に在住しています
          <ToolTip
            description={
              '入札される方が日本在住の場合、管理者が消費税をお支払いします'
            }
          >
            <NotFoundIcon>
              <Image
                src={'/images/icons/help.svg'}
                layout={'fixed'}
                width={16}
                height={16}
              />
            </NotFoundIcon>
          </ToolTip>
        </label>
      </CheckInJapanContainer>
      <ContentButtonContainer>
        {isValidationError && (
          <BidButton
            label={errorText ?? ''}
            isLoading={false}
            onClick={() => doBuy(inJapan)}
            disabled={true}
          />
        )}
        {!isValidationError && (
          <BidButton
            label={loading ? '取引処理中です' : '購入'}
            isLoading={loading}
            onClick={() => doBuy(inJapan)}
          />
        )}
      </ContentButtonContainer>
    </>
  )
}

const BidSuccessStatus: React.VFC<{
  item: Item | undefined
  endAt: Date
  bidHash: string | undefined
}> = ({ item, endAt, bidHash }) => {
  const title = `${item?.name ?? ''}:オークション終了予定時刻`
  const before = subMinutes(endAt, 15)
  const formattedBefore = format(before, "yyyyMMd'T'HHmmss")
  const formattedEndAt = format(endAt, "yyyyMMd'T'HHmmss")
  const calendarUrl = `http://www.google.com/calendar/event?action=TEMPLATE&text=${title}&dates=${formattedBefore}/${formattedEndAt}`
  const onClick = useCallback(() => {
    // donothing
  }, [])
  const isMobile = useMedia().isMobile
  return (
    <>
      <TitleContainer>
        <Image
          layout={'fixed'}
          src={'/images/check-circle.svg'}
          width={isMobile ? 24 : 44}
          height={isMobile ? 24 : 44}
        />
        <TitleContent>入札に成功しました</TitleContent>
      </TitleContainer>
      <Description>
        NFTは入札処理が完了した後、マイページで確認できるようになります。
      </Description>
      <TransactionContainer>
        <TransactionStatus item={item} hash={bidHash ?? ''} />
      </TransactionContainer>
      <ContentButtonContainer>
        <AnchorLink href={calendarUrl} target="blank">
          <CalenderButton
            iconPath={'/images/icons/calendar.svg'}
            label={'終了時刻をカレンダーに登録する'}
            onClick={onClick}
          />
        </AnchorLink>
      </ContentButtonContainer>
    </>
  )
}

const BuySuccessStatus: React.VFC<{
  item: Item | undefined
  hash: string | undefined
}> = ({ item, hash }) => {
  return (
    <>
      <TitleContainer>
        <Image
          layout={'fixed'}
          src={'/images/check-circle.svg'}
          width={44}
          height={44}
        />
        <TitleContent>購入に成功しました</TitleContent>
      </TitleContainer>
      <Description>
        NFTの購入が完了しました。<br></br>
        処理が完了した後、マイページで確認できるようになります。
      </Description>
      <TransactionContainer>
        <TransactionStatus item={item} hash={hash ?? ''} />
      </TransactionContainer>
    </>
  )
}

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const Content = styled.div`
  max-width: 840px;
  max-height: 480px;
  ${media.sp`
    min-width:320px;
    max-height: fit-content;
  `}
  border-radius: 16px;
  overflow: hidden;
  background: ${color.white};
  display: flex;
  box-shadow: 0px 9px 16px rgba(0, 0, 0, 0.04),
    0px 2.01027px 3.57381px rgba(0, 0, 0, 0.0238443),
    0px 0.598509px 1.06402px rgba(0, 0, 0, 0.0161557);
  ${media.sp`
    flex-direction:column;
  `}
`

const Left = styled.div`
  position: relative;
  flex-basis: 50%;
  background-color: ${color.background.bague};
  /* max-width: 600px; */
  ${media.sp`
    /* min-height: 320px; */
  `}
`

const MediaContainer = styled.div`
  margin: 0 auto;
  padding: 32px;
  width: 100%;
  height: 100%;
  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  ${media.sp`
    padding:0;
    width:100%;
    height:320px;
    img, video{
      width: 100%;
      height:100%;
      object-fit:cover;
    }
  `}
`

const InfoContainer = styled.div`
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 32px;
  top: auto;
  background-color: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(32px);
  border-radius: 8px;
  padding: 16px;
  margin-top: 8px;
  box-shadow: 0px 9px 16px rgba(0, 0, 0, 0.06),
    0px 2.01027px 3.57381px rgba(0, 0, 0, 0.03),
    0px 0.598509px 1.06402px rgba(0, 0, 0, 0.0161557);
  ${media.sp`
    left:16px;
    right:16px;
    bottom:16px;
  `}
`

const ItemName = styled.p`
  ${font.mont.subtitle1}
  margin-bottom: 16px;
`

const Right = styled.div`
  flex-basis: 50%;
  padding: 40px;
  /* width: 440px; */
  ${media.sp`
    padding:16px 24px 32px;
  `}
`

const ContentTitle = styled.p`
  ${font.mont.h2};
  ${media.sp`
    ${font.mont.h3};
  `}
`

const PriceRangeContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 64px 0 0 0;
  ${media.sp`
    margin: 0 0 0 0;
  `}
`

const PriceRangeItem = styled.div`
  min-width: 110px;
`

const PriceRangeTitle = styled.div`
  ${font.mont.label}
`

const PriceRangeSubTitle = styled.div`
  ${font.mont.overline}
  margin-top: 8px;
`
const ImageContainer = styled.div`
  margin: 26px 24px;
`

const PriceRangePrice = styled(Chip)`
  margin-top: 8px;
  span {
    max-width: 70px;
  }
`

const InputPriceContainer = styled.div`
  width: 100%;
  margin: 64px 0 0 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  ${media.sp`
    margin:16px 0 0 0;
  `}
`

const InputPrice = styled.input`
  ${font.mont.h2}
  width: 100%;
  border: 4px solid ${color.primary};
  box-sizing: border-box;
  border-radius: 34px;
  flex-grow: 2;
  text-align: center;
  :focus {
    outline: 0px;
  }
  ::-webkit-inner-spin-button,
  ::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  ${media.sp`
    ${font.mont.h3}
    border: 2px solid ${color.primary};
  `}
`

const InputUnit = styled.span`
  color: ${color.primary};
  ${font.mont.h2}
  margin-left: 4px;
  ${media.sp`
    ${font.mont.h3}
  `}
`

const ContentButtonContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const CloseButton = styled.div`
  cursor: pointer;
  margin-top: 96px;
  ${media.sp`
    margin-top:16px;
  `}
`

const BidButton = styled(ButtonBase)`
  width: 100%;
  margin-top: 32px;
  line-height: 1.5;
  ${media.sp`
    margin-top: 16px;
  `}
`

const TitleContainer = styled.div`
  ${font.mont.h2};
  color: ${color.subColor.blue};
  display: flex;
  align-items: center;
`
const TitleContent = styled.div`
  ${font.mont.h2};
  color: ${color.subColor.blue};
  margin-left: 16px;
  ${media.sp`
    ${font.mont.h4}
  `}
`

const Description = styled.div`
  ${font.mont.body1};
  color: ${color.content.middle};
  margin: 32px 0;
  ${media.sp`
    ${font.mont.caption};
  `}
`

const TransactionContainer = styled.div`
  width: 100%;
  margin: 64px 0;
  ${media.sp`
    margin:16px 0;
  `}
`
const AnchorLink = styled.a`
  text-decoration: none;
`

const CalenderButton = styled(SimpleButton)`
  width: 100%;
`

const NotFoundIcon = styled.span`
  margin-left: 4px;
  height: 16px;
  width: 16px;
`

const CheckInJapanContainer = styled.div`
  margin-top: 8px;
`