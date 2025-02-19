import { AccountInfo } from '@kyuzan/mint-sdk-js'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getSdk } from '../../sdk'

export type AccountInfoState = {
  data: {
    accountInfoMap: Record<string, AccountInfo>
  }
  meta: {
    loading: boolean
    error: string | undefined
  }
}

export const initialAccountInfoState: AccountInfoState = {
  data: {
    accountInfoMap: {},
  },
  meta: {
    error: undefined,
    loading: false,
  },
}

// AsyncAction
export const getAccountInfoActionCreator = createAsyncThunk<
  { accountInfo: AccountInfo | undefined; walletAddress: string },
  { walletAddress: string },
  {
    rejectValue: string
  }
>('app/accountInfo/get', async (arg, thunkApi) => {
  try {
    const data = await getSdk().getAccountInfo({
      walletAddress: arg.walletAddress,
    })
    return { accountInfo: data, walletAddress: arg.walletAddress }
  } catch (err) {
    console.error(err)
    return thunkApi.rejectWithValue(`Account情報を取得できませんでした`)
  }
})

// Slice
export const accountInfoSlice = createSlice({
  name: 'accountInfo',
  initialState: initialAccountInfoState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAccountInfoActionCreator.pending, (state) => {
      state.meta.loading = true
    })
    builder.addCase(
      getAccountInfoActionCreator.rejected,
      (state, { payload }) => {
        state.meta.loading = false
        state.meta.error = payload
      }
    )

    builder.addCase(
      getAccountInfoActionCreator.fulfilled,
      (state, { payload }) => {
        state.meta.loading = false
        state.data.accountInfoMap[payload.walletAddress] =
          payload.accountInfo || {
            avatarImgUrl: '',
            avatarImgId: '',
            displayName: '',
            bio: '',
            twitterAccountName: '',
            instagramAccountName: '',
            homepageUrl: '',
          }
      }
    )
  },
})
