import Axios, { AxiosInstance } from 'axios'
import * as Agent from 'agentkeepalive'
import * as ethers from 'ethers'
import { recoverTypedSignature_v4 } from 'eth-sig-util'
import { TypedDataDomain, TypedDataField } from '@ethersproject/abstract-signer'
import {
  DefaultApiFactory,
  RegisterItemShippingInfoRequestBody,
  ItemShippingInfo,
  ItemType,
  TradeType,
} from './apiClient/api'
import { CurrencyUnit } from './types/CurrencyUnit'
import { WrongNetworkError } from './Errors'
import { Residence } from './types/Residence'
import { AxiosBody } from './types/AxiosBody'
import { Token } from './types/Token'
import {
  WalletStrategy,
  MetamaskStrategy,
  FortmaticStrategy,
  NodeStrategy,
} from './strategies'
import { BACKEND_URL } from './constants/index'
import { Item } from './types/Item'
import { ItemLog } from './types/ItemLog'
import { NetworkId, networkIdMapLabel } from './types/NetworkId'
import { BigNumber } from './types/BigNumber'
import { WalletInfo } from './types/WalletInfo'
import { WalletSetting } from './types/WalletSetting'
import { ItemsType } from './types/ItemsType'
import { ItemTradeType } from './types/ItemTradeType'
import { AccountInfo } from './apiClient/api'

export {
  Item,
  ItemLog,
  ItemTradeType,
  ItemsType,
  Residence,
  NetworkId,
  BigNumber,
  Token,
  WalletSetting,
  WalletInfo,
  WrongNetworkError,
  CurrencyUnit,
  RegisterItemShippingInfoRequestBody,
  ItemShippingInfo,
  AccountInfo,
}

export class MintSDK {
  /**
   * ether(通常のETHと表示される価格)をBigNumberとして返す
   *
   * @param ether 通常のETHと表示されるもの
   * @returns etherをBigNumberとしてparseしたもの
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * MintSDK.parseEther('3.2') // BigNumber
   * ```
   */
  public static parseEther = (ether: string) => {
    return ethers.utils.parseEther(ether)
  }

  /**
   * BigNumberをether(通常のETHと表示される価格)にフォーマットして返す
   *
   * @param bg
   * @returns Ether単位でパースされたstring
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = await MintSDK.initialize(...)
   * await sdk.connectWallet()  // required
   * const walletInfo = await sdk.getWalletInfo()
   * MintSDK.formatEther(walletInfo.balance) // 3.2
   * ```
   */
  public static formatEther = (bg: BigNumber) => {
    return ethers.utils.formatEther(bg)
  }

  /**
   * @ignore
   */
  private axios: AxiosInstance

  /**
   * @ignore
   */
  private apiClient: ReturnType<typeof DefaultApiFactory>

  private walletStrategy: WalletStrategy

  /**
   *
   * @param accessToken
   * @param networkId アイテムのネットワークIDを指定
   * @param walletSetting
   */
  public constructor(
    private accessToken: string,
    private networkIds: NetworkId[],
    walletSetting: WalletSetting,
    // for Developing SDK
    devOption?: {
      backendUrl?: string
      jsonRPCUrl?: string
    }
  ) {
    if (typeof globalThis.window === 'undefined') {
      this.walletStrategy = new NodeStrategy()
    } else if (MetamaskStrategy.checkExistsWeb3ProviderInWindow()) {
      this.walletStrategy = new MetamaskStrategy(networkIds)
    } else {
      this.walletStrategy = new FortmaticStrategy(
        networkIds,
        walletSetting,
        devOption
      )
    }

    const backendBaseUrl = devOption?.backendUrl ?? BACKEND_URL
    const keepAliveAgent = new Agent.HttpsAgent({
      keepAlive: true,
    })
    this.axios = Axios.create({
      httpsAgent: keepAliveAgent,
      baseURL: backendBaseUrl,
      headers: {
        'annapurna-access-token': accessToken,
      },
    })
    this.apiClient = DefaultApiFactory(undefined, backendBaseUrl, this.axios)
  }

  /**
   * 有効なアカウントがあるの状態を返す
   *
   * @returns ウォレットが接続されていればtrue
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = await MintSDK.initialize(...)
   * await sdk.isWalletConnect()
   * ```
   */
  public isWalletConnect = async () => {
    return await this.walletStrategy.isWalletConnect()
  }

  /**
   * ウォレットに接続
   * MetamaskがインストールされているブラウザではMetamaskが、されていない場合はFortmaticに接続を行う
   * ウォレットが接続されるとResolveされる
   * ウォレット接続をキャンセルした場合は、Rejectされる
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * await sdk.isWalletConnect() // false
   * await sdk.connectWallet()
   * await sdk.isWalletConnect()  // true
   * ```
   */
  public connectWallet = async () => {
    await this.walletStrategy.connectWallet()
  }

  /**
   * ウォレットから切断
   * Fortmaticの場合、切断される
   * **MetaMaskが接続されている場合は何も実行されない**
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = await MintSDK.initialize(...)
   * await sdk.disconnectWallet()
   * ```
   */
  public disconnectWallet = async () => {
    await this.walletStrategy.disconnectWallet()
  }

  /**
   * ウォレットのアカウントと残高情報などの情報が取得できる
   *
   * **Required**
   * - ウォレットに接続していること
   *
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * await sdk.connectWallet()  // required
   * await sdk.getWalletInfo()
   * ```
   */
  public getWalletInfo: () => Promise<WalletInfo> = async () => {
    return await this.walletStrategy.getWalletInfo()
  }

  /**
   * Transactionが成功するとResolveするPromiseを返します
   *
   * **Required**
   * - ウォレットに接続していること
   *
   * @param txHash {@link ethers.providers.TransactionResponse}のhashプロパティ
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * await sdk.connectWallet() // required
   * try {
   *  const tx = await sdk.sendTxBuyItem('item.itemId')
   *  await tx.wait()
   *  // success transaction
   * } catch (err) {
   *  // display error message
   * }
   * ```
   */
  public waitForTransaction = async (txHash: string) => {
    if (!(await this.isWalletConnect())) {
      throw new Error('Wallet is not connected')
    }
    const wallet = this.walletStrategy.getProvider()
    await wallet.waitForTransaction(txHash)
  }

  /**
   * 公開中(Items.openStatus === 'open')のアイテムを取得
   * ステータスの変更は管理画面から行えます。
   *
   * #### 制限事項
   *
   * 次の制限事項に注意してください。
   *
   * - `tradeType === 'fixedPrice'`を指定した場合、`'endAt' | 'startAt'`によるsortは行えません
   * - `tradeType === 'auction'`を指定した場合、`price`によるsortは行えません
   * - `onSale`を指定した場合、`startAt`によるsortは行えません
   *
   * @param paging
   * @returns
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   *
   * const items = await sdk.getItems({ onSale: true })
   * ```
   */

  public getItems = async (
    {
      perPage,
      page,
      networkId,
      itemType,
      tradeType,
      onSale,
      sort,
    }: {
      /**
       * 1ページあたりのアイテム数。
       * デフォルトは30。
       */
      perPage: number
      /**
       * ページ数。
       */
      page: number
      /**
       * `'endAt','startAt'`はオークションの場合に有効で、オークションの終了・開始時間でsortを行います。`price`は固定価格販売の場合のみ有効です。
       */
      sort?: {
        sortBy: 'endAt' | 'startAt' | 'price'
        order: 'asc' | 'desc'
      }
      /**
       * 指定しなければ、コンストラクターの値が使われます
       */
      networkId?: NetworkId[]
      itemType?: ItemsType
      tradeType?: ItemTradeType
      /**
       *
       */
      onSale?: boolean
    } = {
      perPage: 30,
      page: 1,
    }
  ) => {
    const { data } = await this.apiClient.getItemList(
      this.accessToken,
      networkId
        ? networkId.map((id) => id.toString())
        : this.networkIds.map((id) => id.toString()),
      itemType ? (itemType as ItemType) : undefined,
      tradeType ? (tradeType as TradeType) : undefined,
      typeof onSale !== 'undefined' ? (onSale ? 'true' : 'false') : undefined,
      perPage.toString(),
      page.toString(),
      sort ? sort.sortBy : undefined,
      sort ? sort.order : undefined
    )
    const items = data.data as Item[]
    const formatItems = items.map(this.formatItem)
    return formatItems
  }

  /**
   * 指定したアドレスがBidしたItemの一覧を取得
   *
   * @param address ウォレットのアドレス
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * const item = await sdk.getItemsByBidderAddress('0x1111......')
   * ```
   */
  public getItemsByBidderAddress = async (address: string) => {
    const { data } = await this.axios.get('v3_getItemsByBidderAddress', {
      params: {
        address,
        networkIds: this.networkIds,
      },
    })
    const items = data.data as Item[]
    return items.map(this.formatItem)
  }

  /**
   * ItemのitemId指定でアイテムを取得
   *
   * @param itemId {@link Item}のitemId
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * const item = await sdk.getItemById('item.itemId')
   * ```
   */
  public getItemById = async (itemId: string) => {
    const { data } = await this.axios.get('v2_item', { params: { itemId } })
    const item = data.data as Item
    return this.formatItem(item)
  }

  /**
   * Tokenに紐づいたItemを取得
   * @param token
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * const item = await sdk.getItemByToken(token)
   * ```
   */
  public getItemByToken = async (token: Token) => {
    const { data } = await this.axios.get<AxiosBody<Item>>('v2_itemByToken', {
      params: {
        tokenId: token.tokenId,
        networkId: token.item.networkId,
        tokenAddress: token.contractAddress,
        mintContractAddress: token.contractAddress,
      },
    })
    const item = data.data
    return this.formatItem(item)
  }

  /**
   * アイテムの履歴(bidされた、買われた)の取得
   * 最新の物から返される
   *
   * @param itemId {@link Item}のitemId
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = await MintSDK.initialize(...)
   * const item = await sdk.getItemLogs('Item.itemId')
   * ```
   */
  public getItemLogs = async (
    itemId: string,
    paging = {
      perPage: 30,
      page: 1,
    }
  ) => {
    const { data } = await this.apiClient.getItemLogs(
      this.accessToken,
      itemId,
      paging.perPage.toString(),
      paging.page.toString()
    )
    const logs = data.data
    return logs.map((l) => ({
      ...l,
      createAt: new Date(l.createAt),
    }))
  }

  /**
   * 指定したアドレスが所持しているMINT経由で獲得したトークンを取得
   *
   * @param address Walletのアドレス
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...
   * const tokens = await sdk.getTokensByAddress('0x11111...')
   * ```
   */
  public getTokensByAddress = async (address: string) => {
    const { data } = await this.axios.get<AxiosBody<Token[]>>(
      'v3_tokensByAddress',
      {
        params: { address, networkIds: this.networkIds },
      }
    )
    return data.data
  }

  /**
   * 指定した金額でBidするトランザクションを発行
   * Bidする謹賀具の総額を`bidPrice`に指定する
   *
   * **Required**
   * - ウォレットに接続していること
   *
   * @param itemId {@link Item}のitemId
   * @param bidPrice 単位はether
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * await sdk.connectWallet() // required
   * try {
   *  const tx = await sdk.sendTxBid('item.itemId', 2)
   *  // show loading
   *  await tx.wait()
   *  // success transaction
   * } catch (err) {
   *  // display error message
   * }
   * ```
   */
  public sendTxBid = async (itemId: string, bidPrice: number) => {
    if (!(await this.isWalletConnect())) {
      throw new Error('Wallet is not connected')
    }

    const item = await this.getItemById(itemId)
    await this.validateNetworkForItem(item)
    const wallet = this.walletStrategy.getProvider()
    const { abi, address } = await this.getMintShopContractInfo(item.networkId)
    const signer = wallet.getSigner()
    const shopContract = new ethers.Contract(address, abi, signer)
    if (item.tradeType !== 'autoExtensionAuction') {
      throw new Error("Item's tradeType is not auction")
    }
    const initialPrice = ethers.utils
      .parseEther(String(item.initialPrice))
      .toString()
    const price = ethers.utils.parseEther(String(bidPrice)).toString()
    const startAt = item.startAt!.getTime() / 1000
    const endAt = item.endAt!.getTime() / 1000
    const sign = await this.apiClient.getItemSignedDataBidAuction(
      this.accessToken,
      itemId
    )
    return (await shopContract.bidAuction(
      item.mintContractAddress,
      item.tokenId,
      initialPrice,
      startAt,
      endAt,
      price,
      sign.data.data.signedData,
      {
        value: price,
      }
    )) as ethers.providers.TransactionResponse
  }

  /**
   * オークションで勝利したアイテムを引き出すトランザクションを発行
   * ユーザーの居住地を問うUIを合わせて実装必要です。居住地を設定することで消費税に関する会計処理などがスムーズに行えます
   *
   * **Required**
   * - ウォレットに接続していること
   * - **自動延長オークションは、`withdrawableAt`以降に引き出し可能です**
   *
   * @param itemId {@link Item}のitemId
   * @param userResidence {@link Residence} 購入者の居住地を指定する
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * await sdk.connectWallet() // required
   * try {
   *  const tx = await sdk.sendTxMakeSuccessfulBid('item.itemId', 'jp')
   *  // show loading
   *  await tx.wait()
   *  // success transaction
   * } catch (err) {
   *  // display error message
   * }
   * ```
   */
  public sendTxMakeSuccessfulBid = async (
    itemId: string,
    userResidence: Residence = 'unknown'
  ) => {
    // wallet connect check
    if (!(await this.isWalletConnect())) {
      throw new Error('Wallet is not connected')
    }
    const item = await this.getItemById(itemId)
    await this.validateNetworkForItem(item)
    const wallet = this.walletStrategy.getProvider()
    const { abi, address } = await this.getMintShopContractInfo(item.networkId)
    const signer = wallet.getSigner()
    const shopContract = new ethers.Contract(address, abi, signer)
    if (item.tradeType !== 'autoExtensionAuction') {
      throw new Error("Item's tradeType is not auction")
    }
    const sign = await this.apiClient.getItemSignedDataBuyAuction(
      this.accessToken,
      itemId
    )
    const tx = (await shopContract.buyAuction(
      item.mintContractAddress,
      item.tokenId,
      item.tokenURI,
      item.authorAddress,
      item.endAt!.getTime() / 1000,
      item.feeRatePermill,
      sign.data.data.signedData
    )) as ethers.providers.TransactionResponse
    const hash = tx.hash
    await this.axios.post('/v2_registerTransactionReceiptsApp', {
      txHash: hash,
      itemId,
      residence: userResidence,
    })
    return tx
  }

  /**
   * FixedPriceのアイテムを購入するトランザクションを発行
   * ユーザーの居住地を問うUIを合わせて実装必要
   * 消費税に関する会計処理などがスムーズに行えます
   *
   * **Required**
   * - ウォレットに接続していること
   *
   * @param itemId {@link Item}のitemId
   * @param userResidence {@link Residence} 購入者の居住地を指定する
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * await sdk.connectWallet() // required
   * try {
   *  const tx = await sdk.sendTxBuyItem('item.itemId', 'jp')
   *  // show loading
   *  await tx.wait()
   *  // success transaction
   * } catch (err) {
   *  // display error message
   * }
   * ```
   */
  public sendTxBuyItem = async (
    itemId: string,
    userResidence: Residence = 'unknown'
  ) => {
    if (!(await this.isWalletConnect())) {
      throw new Error('Wallet is not connected')
    }

    const item = await this.getItemById(itemId)
    await this.validateNetworkForItem(item)
    const wallet = this.walletStrategy.getProvider()
    const { abi, address } = await this.getMintShopContractInfo(item.networkId)
    const signer = wallet.getSigner()
    const shopContract = new ethers.Contract(address, abi, signer)
    if (item.tradeType !== 'fixedPrice') {
      throw new Error("Item's tradeType is not fixedPrice")
    }

    const {
      data: {
        data: { signedData },
      },
    } = await this.apiClient.getItemSignedDataFixedPrice(
      this.accessToken,
      itemId
    )

    const price = ethers.utils
      .parseEther((item.price as number).toString())
      .toString()
    const tx = (await shopContract.buyFixedPrice(
      item.mintContractAddress,
      item.tokenId,
      item.tokenURI,
      item.authorAddress,
      price,
      item.feeRatePermill,
      signedData,
      {
        value: price,
      }
    )) as ethers.providers.TransactionResponse
    await this.axios.post('/v2_registerTransactionReceiptsApp', {
      txHash: tx.hash,
      itemId,
      residence: userResidence,
    })
    return tx
  }

  /**
   * アカウントが変更された際に呼び出される関数を設定できる
   *
   * @param callback
   * @returns void
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * sdk.onAccountsChange((accounts: string[]) => {
   *    // some thing
   * })
   * ```
   */
  public onAccountsChange = (callback: (accounts: string[]) => any) => {
    this.walletStrategy.onAccountsChange(callback)
  }

  /**
   * @ignore
   */
  public offAccountsChange = (callback?: (accounts: string[]) => any) => {
    this.walletStrategy.offAccountsChange(callback)
  }

  /**
   * ウォレットに接続した際に呼び出される関数を設定できる
   *
   * @param callback
   * @returns void
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * sdk.onConnect(() => {
   *    // some thing
   * })
   * ```
   */
  public onConnect = (callback: () => any) => {
    this.walletStrategy.onConnect(callback)
  }

  /**
   * @ignore
   */
  public offConnect = (callback?: () => any) => {
    this.walletStrategy.offConnect(callback)
  }

  /**
   * ウォレットから切断した際に呼び出される関数を設定できる
   *
   * @param callback
   * @returns void
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   * const sdk = await MintSDK.initialize(...)
   * sdk.onDisconnect(() => {
   *    // some thing
   * })
   * ```
   */
  public onDisconnect = (callback: () => any) => {
    this.walletStrategy.onDisconnect(callback)
  }

  /**
   * @ignore
   */
  public offDisconnect = (callback?: () => any) => {
    this.walletStrategy.offDisconnect(callback)
  }

  /**
   * サーバーのUnixタイムを取得
   *
   * @returns unix time (ms)
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = MintSDK.initialize(...)
   * await sdk.connectWallet()
   * await sdk.getServerUnixTime()  // ex) 1615444120104
   * ```
   */
  public getServerUnixTime = async () => {
    const { data } = await this.axios.get<AxiosBody<number>>('serverSideTime')
    return data.data
  }

  /**
   * MetaMaskかどうかを判定
   *
   * @returns trueならばMetaMask
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = MintSDK.initialize(...)
   * await sdk.isInjectedWallet() // true
   * ```
   */
  public isInjectedWallet = () => {
    return typeof (window as any).ethereum !== 'undefined'
  }

  /**
   * 適切なネットワークかを判定
   *
   * @returns trueならば適切なネットワーク
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = MintSDK.initialize(...)
   * await sdk.isCorrectNetwork() // true
   * ```
   */
  public isCorrectNetwork = async () => {
    if (this.isInjectedWallet()) {
      return this.networkIds.includes(
        parseInt((window as any).ethereum.networkVersion, 10) as any
      )
    } else {
      const network = await this.walletStrategy.getProvider().getNetwork()
      return this.networkIds.includes(network.chainId as any)
    }
  }

  /**
   * 接続中のネットワークIDを返す
   *
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = MintSDK.initialize(...)
   * await sdk.connectWallet()
   * await sdk.getConnectedNetworkId()
   * ```
   */
  public getConnectedNetworkId = async () => {
    return await this.walletStrategy.getConnectedNetworkId()
  }

  /**
   * 物理アイテム付きのItemの発送先情報を登録
   * ユーザーに配送先情報を入力してもらうフォームなどを用意して使ってください
   *
   * **Required**
   * - ウォレットに接続していること
   * - ユーザーが{@link Item}の`type`が`nftWithPhysicalProduct`であること
   * - {@link Item}が引き出されている or 買われていること（{@link Token}になっていること)
   * - ユーザーが{@link Item}の`physicalOrderStatus`が`shippingInfoIsBlank`であること
   * - ユーザーが{@link Token}の所有者であること
   *
   * @param arg itemId = {@link Item}のitemId, shippingInfo = 配送先情報
   * @returns
   *
   */
  public registerItemShippingInfo = async (arg: {
    itemId: string
    shippingInfo: Omit<
      RegisterItemShippingInfoRequestBody,
      'signedData' | 'chainType' | 'networkId' | 'contractAddress' | 'tokenId'
    >
  }) => {
    if (!(await this.isWalletConnect())) {
      throw new Error('Wallet is not connected')
    }

    const item = await this.getItemById(arg.itemId)
    const signingData: Omit<RegisterItemShippingInfoRequestBody, 'signedData'> =
      {
        chainType: item.chainType as any,
        networkId: item.networkId,
        contractAddress: item.mintContractAddress,
        tokenId: item.tokenId,
        ...arg.shippingInfo,
      }
    const signDataType = {
      domain: {
        chainId: item.networkId,
        name: 'フィジカルアイテムの発送先情報',
        version: '1',
      },
      message: signingData,
      primaryType: 'ShippingInformation',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
        ],
        // Not an EIP712Domain definition
        ShippingInformation: [
          { name: 'chainType', type: 'string' },
          { name: 'networkId', type: 'int256' },
          { name: 'contractAddress', type: 'string' },
          { name: 'tokenId', type: 'int256' },
          { name: 'name', type: 'string' },
          { name: 'email', type: 'string' },
          { name: 'postalCode', type: 'string' },
          { name: 'prefecture', type: 'string' },
          { name: 'city', type: 'string' },
          { name: 'address1', type: 'string' },
          { name: 'address2', type: 'string' },
          { name: 'tel', type: 'string' },
          { name: 'memo', type: 'string' },
        ],
      },
    }
    const signedData = await this.signData({ msgParams: signDataType })
    // apiへのpost
    const body = {
      ...signingData,
      signedData,
    }
    await this.apiClient.registerItemShippingInfo(
      this.accessToken,
      item.itemId,
      body
    )
  }

  /**
   * 物理アイテム付きのItemの入力された発送先情報を取得
   * {@link Items}セキュリティの観点から、ユーザーのSignが必要になります
   *
   * **Required**
   * - ウォレットに接続していること
   * - ユーザーが{@link Item}の`type`が`nftWithPhysicalProduct`であること
   * - {@link Item}が引き出されている or 買われていること（{@link Token}になっていること)
   * - ユーザーが{@link Item}の`physicalOrderStatus`が`wip`または`ship`であること
   * - ユーザーが{@link Token}の所有者であること
   *
   * @param arg itemId = {@link Item}のitemI
   * @returns
   *
   */
  public getItemShippingInfo = async (arg: { itemId: string }) => {
    if (!(await this.isWalletConnect())) {
      throw new Error('Wallet is not connected')
    }
    const { address } = await this.getWalletInfo()

    const item = await this.getItemById(arg.itemId)
    const signDataType = {
      domain: {
        chainId: item.networkId,
        name: 'フィジカルアイテムの発送先情報の確認',
        version: '1',
      },
      message: {
        address,
      },
      primaryType: 'WalletAddress',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
        ],
        WalletAddress: [{ name: 'address', type: 'string' }],
      },
    }
    const signedData = await this.signData({ msgParams: signDataType })

    const res = await this.apiClient.getItemShippingInfo(
      this.accessToken,
      item.itemId,
      address,
      signedData
    )
    return res.data
  }

  /**
   * ユーザーのウォレットアドレスの画像や表示名を取得できる
   * 設定されていない場合は、各項目空文字が入っています
   *
   * @param
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = MintSDK.initialize(...)
   * await sdk.connectWallet()
   * const accountInfo = await sdk.getAccountInfo({ walletAddress: '0xxxxxxxx' })
   * ```
   */
  public getAccountInfo = async (arg: { walletAddress: string }) => {
    const res = await this.apiClient.getAccountInfo(
      this.accessToken,
      arg.walletAddress
    )
    return res.data.data
  }

  /**
   * ユーザーのウォレットアドレスの画像や表示名を設定できる
   * 全ての項目は optionalです。設定しない場合は空文字を入れてください
   * `avatarImgId`は`sdk.uploadImg`の返り値です
   *
   *
   * **Required**
   * - ウォレットに接続していること
   *
   * @param
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = MintSDK.initialize(...)
   * await sdk.connectWallet()
   * const imgId = await sdk.uploadAvatarImg()
   * await sdk.updateAccountInfo({ imgId, .... })
   * ```
   */
  public updateAccountInfo = async (arg: {
    avatarImgId: string
    displayName: string
    bio: string
    twitterAccountName: string
    instagramAccountName: string
    homepageUrl: string
  }) => {
    if (!(await this.isWalletConnect())) {
      throw new Error('Wallet is not connected')
    }
    const networkId = await this.getConnectedNetworkId()
    const signDataType = {
      domain: {
        chainId: networkId,
        name: 'アカウント情報の更新',
        version: '1',
      },
      message: {
        avatarImgId: arg.avatarImgId,
        displayName: arg.displayName,
        bio: arg.bio,
        twitterAccountName: arg.twitterAccountName,
        instagramAccountName: arg.instagramAccountName,
        homepageUrl: arg.homepageUrl,
      },
      primaryType: 'AccountInfo',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
        ],
        AccountInfo: [
          { name: 'avatarImgId', type: 'string' },
          { name: 'displayName', type: 'string' },
          { name: 'bio', type: 'string' },
          { name: 'twitterAccountName', type: 'string' },
          { name: 'instagramAccountName', type: 'string' },
          { name: 'homepageUrl', type: 'string' },
        ],
      },
    }

    const signedData = await this.signData({ msgParams: signDataType })
    await this.apiClient.createAccountInfo(this.accessToken, {
      signedData,
      networkId,
      avatarImgId: arg.avatarImgId,
      displayName: arg.displayName,
      bio: arg.bio,
      twitterAccountName: arg.twitterAccountName,
      instagramAccountName: arg.instagramAccountName,
      homepageUrl: arg.homepageUrl,
    })
  }

  /**
   * `sdk.updateAccountInfo`の引数の`imgId`を取得できる
   * uploadedImgUrlはアップロードされた画像のRead用のURLです。
   *
   * **Required**
   * - ウォレットに接続していること
   *
   * @param
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = MintSDK.initialize(...)
   * await sdk.connectWallet()
   * const { imgId, uploadedImgUrl } = await sdk.uploadAccountInfoAvatar({ file })
   * ```
   */
  public uploadAccountInfoAvatar = async (arg: { file: File }) => {
    if (!(await this.isWalletConnect())) {
      throw new Error('Wallet is not connected')
    }

    const res = await this.apiClient.getAvatarSignedUrlToUpload(
      this.accessToken
    )
    await this.uploadData({
      signedUrl: res.data.data.signedUrlForUpload,
      file: arg.file,
    })
    return {
      imgId: res.data.data.imgId,
      uploadedImgUrl: res.data.data.signedUrlForRead,
    }
  }

  /**
   * @ignore
   */
  private signData = async (arg: { msgParams: any }) => {
    if (!(await this.isWalletConnect())) {
      throw new Error('Wallet is not connected')
    }
    return new Promise<string>((resolve, reject) => {
      const msgParams = JSON.stringify(arg.msgParams)
      const wallet = this.walletStrategy.getProvider()
      wallet
        .getSigner()
        .getAddress()
        .then((from) => {
          const params = [from, msgParams]
          const method = 'eth_signTypedData_v4'
          wallet.provider.sendAsync!(
            {
              method,
              params,
            },
            (error, result) => {
              if (error) {
                reject(error)
              }
              resolve(result.result)
            }
          )
        })
        .catch(reject)
    })
  }

  /**
   * EIP-712仕様で与えられたデータを署名します。
   *
   * **Required**
   * - ウォレットに接続していること
   *
   * @param arg
   * @returns
   * ``` typesctipt
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = MintSDK.initialize(...)
   * const arg = {
   *  domain: {name: "Member"},
   *  types: {Person: [ { name: 'name', type: 'string'}]},
   *  value: { Man: { name: 'Tom'}}
   * }
   * const { data, sig } = await sdk.signTypedData(arg)
   * ```
   */

  public signTypedData = async (arg: {
    domain: TypedDataDomain
    types: Record<string, Array<TypedDataField>>
    value: Record<string, any>
  }) => {
    if (!(await this.isWalletConnect())) {
      throw new Error('Wallet is not connected')
    }

    const wallet = await this.walletStrategy.getProvider()

    const signature = await wallet
      .getSigner()
      ._signTypedData(arg.domain, arg.types, arg.value)
    const signData = JSON.stringify(
      ethers.utils._TypedDataEncoder.getPayload(
        arg.domain,
        arg.types,
        arg.value
      )
    )

    return {
      data: signData,
      sig: signature,
    }
  }

  /**
   * 署名されたデータを復号してウォレットアドレスを返します。
   * 返される文字列は小文字で返ってきます。
   * @param arg
   * @returns
   * ``` typesctipt
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = MintSDK.initialize(...)
   * const { address } = await this.getWalletInfo()
   * const { data, sig } = await sdk.signTypedData(arg)
   * const recoverdAddress = MintSDK.recoverdSignData({data, sig})
   *
   * if(address.toLowerCase() === recoverdAddress){
   *  console.log("success")
   * }
   * ```
   */

  public static recoverySignData = (arg: { data: string; sig: string }) => {
    const recoveredAddress = recoverTypedSignature_v4({
      data: JSON.parse(arg.data),
      sig: arg.sig,
    })
    return recoveredAddress
  }

  /**
   * signedUrlを用いてFileをアップロード
   * @ignore
   */
  private uploadData = async (arg: { signedUrl: string; file: File }) => {
    const axios = Axios.create({
      headers: { 'Content-Type': 'application/octet-stream' },
    })
    await axios.put(arg.signedUrl, arg.file)
  }

  /**
   * 指定したネットワークをウォレットに追加する
   * 137 => Polygon本番ネットワーク
   * 80001 => Polygonテストネットワーク
   *
   * **Required**
   * sdk.isInjectedWallet() => trueの場合のみ（MetaMaskのみ使える）
   *
   * @returns
   *
   * ```typescript
   * import { MintSDK } from '@kyuzan/mint-sdk-js'
   *
   * const sdk = MintSDK.initialize(...)
   * await sdk.connectWallet()
   * await sdk.addEthereumChain(137)
   * ```
   */
  public addEthereumChain = async (networkId: 137 | 80001) => {
    type AddEthereumChainParameter = {
      chainId: string // A 0x-prefixed hexadecimal string
      chainName: string
      nativeCurrency: {
        name: string
        symbol: string // 2-6 characters long
        decimals: 18
      }
      rpcUrls: string[]
      blockExplorerUrls?: string[]
      iconUrls?: string[] // Currently ignored.
    }
    const NETWORK_ID_MAP_CHAIN_PARAMETER: Record<
      137 | 80001,
      AddEthereumChainParameter
    > = {
      137: {
        chainId: '0x89',
        chainName: 'Matic Network',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://rpc-mainnet.maticvigil.com/'],
        blockExplorerUrls: ['https://explorer-mainnet.maticvigil.com/'],
      },
      80001: {
        chainId: '0x13881',
        chainName: 'Mumbai',
        nativeCurrency: {
          name: 'MATIC',
          symbol: 'MATIC',
          decimals: 18,
        },
        rpcUrls: ['https://rpc-mumbai.matic.today'],
        blockExplorerUrls: ['https://explorer-mumbai.maticvigil.com/'],
      },
    }
    // TODO: Fortmaticだとシカとか、適切なエラーを投げてやればいい
    await (window as any).ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [NETWORK_ID_MAP_CHAIN_PARAMETER[networkId]], // you must have access to the specified account
    })
  }

  /**
   * @ignore
   */
  private validateNetworkForItem = async (item: Item) => {
    const currentNetwork = await this.getConnectedNetworkId()
    if (currentNetwork !== item.networkId) {
      throw new WrongNetworkError('Network is not correct')
    }
  }

  /**
   * @ignore
   */
  private getMintShopContractInfo = async (networkId: NetworkId) => {
    const { data } = await this.axios.get('/v2_projectConfig')
    const networkLabel = networkIdMapLabel[networkId]
    const abi = data.data.contract.mintShopContract[networkLabel].abi
    const address = data.data.contract.mintShopContract[networkLabel].address
    return {
      abi,
      address,
    }
  }

  /**
   * @ignore
   */
  private formatItem = (item: Item) => {
    return {
      ...item,
      startAt: item.startAt ? new Date(item.startAt) : undefined,
      endAt: item.endAt ? new Date(item.endAt) : undefined,
      defaultEndAt: item.defaultEndAt ? new Date(item.defaultEndAt) : undefined,
      withdrawableAt: item.withdrawableAt
        ? new Date(item.withdrawableAt)
        : undefined,
    } as Item
  }
}
