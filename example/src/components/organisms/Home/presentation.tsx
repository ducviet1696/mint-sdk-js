import React from 'react'
import styled from '@emotion/styled'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import Slider from 'react-slick'
// import Image from 'next/image'
// import Link from 'next/link'
// import Skeleton from 'react-loading-skeleton'
import { font, color, media } from '../../../style'
// import { Anchor } from '../../atoms/Anchor'
// import { DefaultAvatarIcon } from '../../atoms/DefaultAvatarIcon'
import { Item } from '@kyuzan/mint-sdk-js'
import { addDays } from 'date-fns'
import { ActiveCard } from '../../molecules/Card/active'
// import { EndedCard } from '../../molecules/Card/ended'
// import { ReadyCard } from '../../molecules/Card/ready'
// import {Profile} from '../../molecules/Profile'
import { CarouselItem } from '../../molecules/CarouselItem'

export const Presentation: React.VFC = () => {
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    fade: true,
    arrows: false,
  }

  return (
    <Container>
      <Hero>
        <Carousels {...settings}>
          <CarouselItem
            imageURL={'/images/items/collection001/001.jpg'}
            isEnd={false}
            name={'Chie 001'}
            price={0.613}
          />
          <CarouselItem
            imageURL={'/images/items/collection002/001.jpg'}
            isEnd={true}
            name={'球体関節人形 001'}
            price={0.613}
          />
          <CarouselItem
            imageURL={'/images/items/collection003/001.jpg'}
            isEnd={false}
            name={'ばんえい競馬 001'}
            price={0.613}
          />
        </Carousels>
        <HeroContents>
          <Eng>Shin Yamagishi</Eng>
          <Title>山岸 伸</Title>
          <SubTitle>NFT Collection</SubTitle>
        </HeroContents>
      </Hero>
      <Margin64 />
      <Collections>
        <AuctionLabel>オークション中</AuctionLabel>
        <CollectionLabel>Collection 001</CollectionLabel>
        <CollectionTitle>輓馬</CollectionTitle>
        <CollectionLink href="">
          コレクション一覧へ<span></span>
        </CollectionLink>
        <Margin32 />
        <ItemWrap>
          <ActiveCard
            item={{
              ...loseItem,
              name: 'ばんえい競馬 001',
              imageURIHTTP: {
                url: '/images/items/collection003/001.jpg',
                mimeType: 'image',
              },
            }}
          />
          <ActiveCard
            item={{
              ...loseItem,
              name: 'ばんえい競馬 002',
              imageURIHTTP: {
                url: '/images/items/collection003/002.jpg',
                mimeType: 'image',
              },
            }}
          />
          <ActiveCard
            item={{
              ...loseItem,
              name: 'ばんえい競馬 003',
              imageURIHTTP: {
                url: '/images/items/collection003/003.jpg',
                mimeType: 'image',
              },
            }}
          />
          <ActiveCard
            item={{
              ...loseItem,
              name: 'ばんえい競馬 004',
              imageURIHTTP: {
                url: '/images/items/collection003/004.jpg',
                mimeType: 'image',
              },
            }}
          />
        </ItemWrap>
      </Collections>

      <Margin128 />
    </Container>
  )
}

const Container = styled.div`
  padding: 72px 0 128px;
`

const Hero = styled.div`
  position: relative;
  background-color: ${color.background.white};
  height: calc(100vh - 144px);
  margin: 0 72px 72px 72px;
  ${media.mdsp`
    margin:0;
    height:calc(100vh - 72px);
  `}
`

const Carousels = styled(Slider)`
  position: relative;
  background-color: ${color.content.dark};
  width: 100%;
  height: 100%;
  /* img{
    width:100%;
    height:100%;
    object-fit: cover;
  } */
`
const HeroContents = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
`
const Title = styled.h1`
  color: ${color.background.white};
  ${font.noto.h1};
  font-size: 96px;
  ${media.mdsp`
    font-size:72px;
  `}
`

const Eng = styled.p`
  color: ${color.background.white};
  ${font.noto.body1};
  letter-spacing: 12px;
  ${media.mdsp`
    letter-spacing: 7px;
  `}
`

const SubTitle = styled.h3`
  color: ${color.background.white};
  ${font.noto.h2};
  letter-spacing: 5px;
  margin: 32px 0 0 0;
  ${media.mdsp`
    font-size:26px;
    letter-spacing: 2px;
  `}
`

const Collections = styled.div`
  text-align: center;
`
const AuctionLabel = styled.div`
  display: inline-block;
  ${font.mont.label};
  margin: 0 auto 16px;
  background-color: ${color.background.dark};
  padding: 2px 8px;
  border-radius: 2px;
  color: ${color.background.white};
`

const CollectionLabel = styled.p`
  color: ${color.content.dark};
  ${font.noto.h4};
  letter-spacing: 0.05em;
  font-weight: 300;
  text-align: center;
`
const CollectionTitle = styled.h2`
  color: ${color.content.dark};
  ${font.noto.h2};
  letter-spacing: 0.05em;
  font-weight: 300;
  text-align: center;
`

const CollectionLink = styled.a`
  display: flex;
  margin: 16px auto 0;
  padding: 8px 16px;
  width: fit-content;
  border-radius: 22px;
  background-color: ${color.background.bague};
  text-decoration: none;
  color: ${color.content.dark};
  ${font.mont.caption};
  span {
    width: 16px;
    height: 16px;
    margin: 0 0 0 4px;
    background: url('/images/chevron-right.svg') no-repeat;
  }
`

const ItemWrap = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  overflow: scroll;
  overflow-y: scroll;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  ${media.sp`
      flex-direction: column;
    `}
`
const Margin128 = styled.div`
  width: 100%;
  height: 128px;
  ${media.mdsp`
    height:256px;
  `}
`
const Margin64 = styled.div`
  width: 100%;
  height: 64px;
  ${media.mdsp`
      height:128px;
    `}
`
const Margin32 = styled.div`
  width: 100%;
  height: 32px;
  ${media.mdsp`
    height:64px;
  `}
`

const otherWalletAddress = '0x000001'

const loseItem: Item = {
  itemId: '0001',
  type: 'nft',
  physicalOrderStatus: 'shippingInfoIsBlank',
  tradeType: 'auction',
  tokenId: 1,
  name: 'test',
  description: 'ddeded',
  tokenURI: '',
  tokenURIHTTP: '',
  imageURI: '',
  imageURIHTTP: {
    url: '/images/items/collection003/008.jpg',
    mimeType: 'image',
  },
  authorAddress: '0x',
  previews: [
    {
      url: 'https://place-hold.it/350x150',
      mimeType: 'image/png',
    },
  ],
  networkId: 4,
  buyerAddress: '0x',
  currentPrice: 2.212,
  currentBidderAddress: otherWalletAddress,
  startAt: new Date(),
  endAt: addDays(new Date(), 1),
  initialPrice: 1,
  // signatureBuyAuction: undefined,
  // signatureBidAuction: undefined,
  // signatureBuyFixedPrice: undefined,
  chainType: 'ethereum',
  collectionId: 'xxxx', // uuidv4
  mintContractAddress: '',
  mintShopContractAddress: '',
  yearCreated: '2021',
  feeRatePermill: 0,
  createdBy: [],
}
