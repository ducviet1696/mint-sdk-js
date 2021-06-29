import React from 'react'
import { actions } from '@storybook/addon-actions'
import { BidModal } from '.'
import { addDays } from 'date-fns'
import { SuccessBidModal } from './success'

const eventsFromObject = actions({
  closeModal: 'clicked',
  onChangeInput: 'hovered',
  doBid: 'ded',
})

export const Basic: React.VFC = () => (
  <BidModal
    itemName={'NIKE AIR JORDAN 1 MID “HYPER ROYAL'}
    endAt={addDays(new Date(), 10)}
    price={21.1}
    media={{
      url: 'https://place-hold.it/350x150',
      mimeType: 'image/png',
    }}
    minBidPrice={1}
    walletBalance={'2'}
    isOpen={true}
    loading={false}
    unit={'ETH'}
    bidPrice={'1'}
    {...eventsFromObject}
  />
)

export const LongName: React.VFC = () => (
  <BidModal
    itemName={
      'NIKE AIR JORDAN 1 MID “HYPER ROYAL NIKE AIR JORDAN 1 MID “HYPER ROYAL'
    }
    endAt={addDays(new Date(), 10)}
    price={21.1}
    media={{
      url: 'https://place-hold.it/350x150',
      mimeType: 'image/png',
    }}
    minBidPrice={1}
    walletBalance={'2'}
    isOpen={true}
    loading={false}
    unit={'ETH'}
    bidPrice={'1'}
    {...eventsFromObject}
  />
)

export const ValidationError: React.VFC = () => (
  <BidModal
    itemName={'NIKE AIR JORDAN 1 MID “HYPER ROYAL'}
    endAt={addDays(new Date(), 10)}
    price={21.1}
    media={{
      url: 'https://place-hold.it/350x150',
      mimeType: 'image/png',
    }}
    minBidPrice={1}
    walletBalance={'2'}
    isOpen={true}
    loading={false}
    unit={'ETH'}
    bidPrice={'0.2'}
    isValidationError={true}
    errorText={'Your bid must be at least 1 ETH'}
    {...eventsFromObject}
  />
)

export const Success: React.VFC = () => (
  <SuccessBidModal
    itemName={'NIKE AIR JORDAN 1 MID “HYPER ROYAL'}
    endAt={addDays(new Date(), 10)}
    price={21.1}
    media={{
      url: 'https://place-hold.it/350x150',
      mimeType: 'image/png',
    }}
    minBidPrice={1}
    walletBalance={'2'}
    isOpen={true}
    loading={false}
    unit={'ETH'}
    bidPrice={'1'}
    {...eventsFromObject}
  />
)

export default {
  title: 'molecules/BidModal',
}
