import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../redux/getStore'
import {
  getBidedActionCreator,
  getOwnItemsActionCreator,
} from '../../../redux/myItems'
import { getShippingInfoActionCreator } from '../../../redux/shippingInfo'
import { withDrawItemActionCreator } from '../../../redux/transaction'
import { Presentation } from './presentation'

export const Container: React.VFC = () => {
  const dispatch = useAppDispatch()

  const walletInfo = useAppSelector((state) => state.app.wallet.data.walletInfo)

  const bidedItems = useAppSelector((state) => {
    // Auction中のものと、引き出していないものだけ表示
    return state.app.myItems.data.bidedItems.filter(
      (item) =>
        item.endAt! > new Date() ||
        (item.currentBidderAddress === walletInfo?.address &&
          !item.buyerAddress)
    )
  })

  const waitingBidedItems = useAppSelector((state) => {
    return state.app.myItems.meta.bidedItemsLoading
  })

  const ownTokens = useAppSelector((state) => {
    return state.app.myItems.data.ownItems
  })

  const waitingOwnTokens = useAppSelector((state) => {
    return state.app.myItems.meta.ownItemsLoading
  })

  const withdrawingItemId = useAppSelector(
    (state) => state.app.transaction.meta.withdrawingItemId
  )

  const withdrawItem = async (itemId: string) => {
    await dispatch(withDrawItemActionCreator({ itemId }) as any)
    // TODO: おめでとう画面に遷移させる
    window.location.reload()
  }

  const loadingShippingInfo = useAppSelector(
    (state) => state.app.shippingInfo.meta.loadingShippingInfo
  )

  const shippingInfo = useAppSelector(
    (state) => state.app.shippingInfo.data.shippingInfo
  )

  const [selectShippingInfoItemId, setSelectShippingInfoItemId] =
    useState<string | undefined>(undefined)

  const showShippingInfo = (itemId: string) => {
    setSelectShippingInfoItemId(itemId)
    dispatch(getShippingInfoActionCreator({ itemId }) as any)
  }

  const hideShippinngInfo = () => {
    setSelectShippingInfoItemId(undefined)
  }

  useEffect(() => {
    if (typeof walletInfo?.address === 'undefined') {
      // TODO: モーダル出して、Walletにコネクトしてもらう
      return
    }
    dispatch(
      getBidedActionCreator({ bidderAddress: walletInfo.address }) as any
    )
    dispatch(
      getOwnItemsActionCreator({ walletAddress: walletInfo.address }) as any
    )
  }, [walletInfo?.address])
  return (
    <Presentation
      waitingBidedItems={waitingBidedItems}
      waitingOwnTokens={waitingOwnTokens}
      bidedItems={bidedItems}
      handleWithdrawItem={withdrawItem}
      handleHideShippingInfo={hideShippinngInfo}
      showShippingInfo={showShippingInfo}
      userWalletAddress={walletInfo?.address ?? ''}
      withdrawingItemId={withdrawingItemId}
      ownTokens={ownTokens}
      showShippingInfoModal={typeof selectShippingInfoItemId !== 'undefined'}
      shippingInfo={
        typeof selectShippingInfoItemId !== 'undefined'
          ? shippingInfo[selectShippingInfoItemId]
          : undefined
      }
      loadingShippingInfo={loadingShippingInfo}
    />
  )
}
