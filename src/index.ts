import { Token } from './types/Token'
import { BACKEND_URL } from './constants/index'
import Axios, { AxiosInstance } from 'axios'
import * as ethers from 'ethers'
import Fortmatic from 'fortmatic'
import { Item } from './types/Item'
import { ItemLog } from './types/ItemLog'
import { NetworkId } from './types/NetworkId'
import { BigNumber } from './types/BigNumber'

type WalletSetting = {
  fortmatic: {
    key: string
  }
}

export class AnnapurnaSDK {
  /**
   * ether(通常のETHと表示される価格)をBigNumberとして返す
   *
   * @param ether 通常のETHと表示されるもの
   * @returns etherをBigNumberとしてparseしたもの
   */
  public static parseEther = (ether: string) => {
    return ethers.utils.parseEther(ether)
  }

  /**
   * BigNumberをether(通常のETHと表示される価格)にフォーマットして返す
   *
   * @param bg
   * @returns Ether単位でパースされたstring
   */
  public static formatEther = (bg: BigNumber) => {
    return ethers.utils.formatEther(bg)
  }

  private constructor(
    private projectId: string,
    private accessToken: string,
    private networkId: NetworkId,
    private provider: ethers.providers.JsonRpcProvider,
    private axios: AxiosInstance,
    private fmProvider: ethers.providers.Web3Provider,
    private metamaskProvider: ethers.providers.Web3Provider | null,
    private shopContract: {
      abi: any
      address: string
    }
  ) {
    // for security
    // ref: https://docs.ethers.io/v5/concepts/best-practices/
    fmProvider.on('network', (_, oldNetwork) => {
      // Whe n a Provider makes its initial connection, it emits a "network"
      // event with a null oldNetwork along with the newNetwork. So, if the
      // oldNetwork exists, it represents a changing network
      if (oldNetwork) {
        window.location.reload()
      }
    })

    if (metamaskProvider) {
      metamaskProvider.on('network', (_, oldNetwork) => {
        if (oldNetwork) {
          window.location.reload()
        }
      })
    }
  }

  public static initialize = async (
    projectId: string,
    accessToken: string,
    networkId: NetworkId,
    walletSetting: WalletSetting,
    // for Developing SDK
    devOption?: {
      backendUrl?: string
      jsonRPCUrl?: string
      contractShopAbi?: any
      contractShopAddress?: string
    }
  ) => {
    const backendBaseUrl = devOption?.backendUrl ?? BACKEND_URL
    const axios = Axios.create({
      baseURL: backendBaseUrl,
      headers: {
        'annapurna-access-token': accessToken,
      },
    })
    const { data } = await axios.get('/projectConfig')
    const providerURL: string =
      devOption?.jsonRPCUrl ??
      (networkId === 1
        ? data.data.infuraURL.main.wss
        : data.data.infuraURL.rinkeby.wss)
    const provider = new ethers.providers.JsonRpcProvider(providerURL)

    const fmProvider = new ethers.providers.Web3Provider(
      new Fortmatic(
        walletSetting.fortmatic.key,
        devOption?.jsonRPCUrl
          ? {
              rpcUrl: devOption.jsonRPCUrl,
            }
          : undefined
      ).getProvider() as any
    )

    const metamaskProvider = (window as any).ethereum
      ? new ethers.providers.Web3Provider((window as any).ethereum)
      : null

    const contractShopAbi =
      devOption?.contractShopAbi ??
      (networkId === 1
        ? data.data.contract.shopContract.main.abi
        : data.data.contract.shopContract.rinkeby.abi)
    const contractShopAddress =
      devOption?.contractShopAddress ??
      (networkId === 1
        ? data.data.contract.shopContract.main.address
        : data.data.contract.shopContract.rinkeby.address)
    const sdk = new AnnapurnaSDK(
      projectId,
      accessToken,
      networkId,
      provider,
      axios,
      fmProvider,
      metamaskProvider,
      {
        abi: contractShopAbi,
        address: contractShopAddress,
      }
    )
    return sdk
  }

  public isLoggedIn = async () => {
    if (this.metamaskProvider && this.metamaskProvider.provider.request) {
      const accounts = await this.metamaskProvider.listAccounts()
      return accounts.length > 0
    } else {
      return await (this.fmProvider.provider as any).user.isLoggedIn()
    }
  }

  public connectWallet = async () => {
    if (this.metamaskProvider && this.metamaskProvider.provider.request) {
      await this.metamaskProvider.provider.request({
        method: 'eth_requestAccounts',
      })
    } else {
      await (this.fmProvider.provider as any).user.login()
    }
  }

  public disconnectWallet = async () => {
    if (await this.isLoggedIn()) {
      const wallet = await this.getLoggedInWallet()
      if (!wallet.provider.isMetaMask) {
        await (wallet.provider as any).user.logout()
      }
    }
  }

  public getWalletInfo = async () => {
    if (!(await this.isLoggedIn())) {
      throw new Error('not LoggedId')
    }

    const wallet = await this.getLoggedInWallet()
    const address = await wallet.listAccounts()
    const balance = await wallet.getBalance(address[0])
    return {
      address,
      balance,
    }
  }

  public waitForTransaction = async (txHash: string) => {
    await this.provider.waitForTransaction(txHash)
  }

  public getItems = async () => {
    const { data } = await this.axios.get('/items')
    const items = data.data
    return items as Item[]
  }

  public getItemsByBidderAddress = async (address: string) => {
    const { data } = await this.axios.get('getItemsByBidderAddress', {
      params: { address },
    })
    return data.data as Item[]
  }

  public getItemById = async (itemId: string) => {
    const { data } = await this.axios.get('item', { params: { itemId } })
    const item = data.data as Item
    return item
  }

  public getItemLogs = async (itemId: string) => {
    const { data } = await this.axios.get('itemLogs', { params: { itemId } })
    const logs = data.data as ItemLog
    return logs
  }

  public getTokensByAddress = async (address: string) => {
    const { data } = await this.axios.get('tokensByAddress', {
      params: { address },
    })
    return data.data as Token[]
  }

  public sendTxBid = async (itemId: string) => {
    if (!(await this.isLoggedIn())) {
      throw new Error('Wallet is not connected')
    }

    const item = await this.getItemById(itemId)
    const wallet = await this.getLoggedInWallet()
    const signer = wallet.getSigner()
    const shopContract = new ethers.Contract(
      this.shopContract.address,
      this.shopContract.abi,
      signer
    )
    if (item.tradeType !== 'auction') {
      throw new Error("Item's tradeType is not auction")
    }
    const price = ethers.utils
      .parseEther((item.price as number).toString())
      .toString()
    return (await shopContract.bid(
      item.tokenId,
      item.tokenURI,
      item.author,
      item.initialPrice,
      item.startAt,
      item.endAt,
      price,
      item.signature,
      {
        value: price,
      }
    )) as ethers.providers.TransactionResponse
  }

  public sendTxMakeSuccessfulBid = async (itemId: string) => {
    // wallet connect check
    if (!(await this.isLoggedIn())) {
      throw new Error('Wallet is not connected')
    }
    const item = await this.getItemById(itemId)
    const wallet = await this.getLoggedInWallet()
    const signer = wallet.getSigner()
    const shopContract = new ethers.Contract(
      this.shopContract.address,
      this.shopContract.abi,
      signer
    )
    if (item.tradeType !== 'auction') {
      throw new Error("Item's tradeType is not auction")
    }
    return (await shopContract.makeSuccessfulBid(
      item.tokenId,
      item.tokenURI,
      item.author,
      item.initialPrice,
      item.startAt,
      item.endAt,
      item.signature
    )) as ethers.providers.TransactionResponse
  }

  public sendTxBuyItem = async (itemId: string) => {
    // wallet connect check
    if (!(await this.isLoggedIn())) {
      throw new Error('Wallet is not connected')
    }
    const item = await this.getItemById(itemId)
    const wallet = await this.getLoggedInWallet()
    const signer = wallet.getSigner()
    const shopContract = new ethers.Contract(
      this.shopContract.address,
      this.shopContract.abi,
      signer
    )
    if (item.tradeType !== 'fixedPrice') {
      throw new Error("Item's tradeType is not fixedPrice")
    }

    const price = ethers.utils
      .parseEther((item.price as number).toString())
      .toString()
    return (await shopContract.buy(
      item.tokenId,
      item.tokenURI,
      item.author,
      price,
      item.signature,
      {
        value: price,
      }
    )) as ethers.providers.TransactionResponse
  }

  public subscribeWalletChange = (callback: (accounts: string[]) => any) => {
    if (this.metamaskProvider) {
      this.metamaskProvider.on('accountsChanged', callback)
    }
    this.fmProvider.on('accountsChanged', callback)
  }

  public subscribeConnect = (callback: (info: { chainId: number }) => any) => {
    if (this.metamaskProvider) {
      this.metamaskProvider.on('connect', callback)
    }
    this.fmProvider.on('connect', callback)
  }

  public subscribeDisConnect = (
    callback: (error: { code: number; message: string }) => any
  ) => {
    if (this.metamaskProvider) {
      this.metamaskProvider.on('disconnect', callback)
    }
    this.fmProvider.on('disconnect', callback)
  }

  private getLoggedInWallet = async () => {
    if (await this.isLoggedIn()) {
      return this.metamaskProvider ?? this.fmProvider
    } else {
      throw new Error('not loggedIn')
    }
  }
}

export default AnnapurnaSDK
