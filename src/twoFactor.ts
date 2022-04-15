import notp from 'notp'
import { base32Decode } from '@ctrl/ts-base32'
import { OnePasswordConnect } from '@1password/connect'

interface IKeyMapper { 
  TOTP:string
  username:number
  password:string
} 

const require1Password = async (url:string, token:string, itemName:string, itemKeyMapper:IKeyMapper) => {
  const op = OnePasswordConnect({
    serverURL: url,
    token: token,
    keepAlive: true
  });
  let allVaults = await op.listVaults();
  const namedItem = await op.getItemByTitle(allVaults[0]?.id ?? '', itemName);
  const loginData = namedItem.fields?.reduce((t:any, i:any) => {
    t[i.label] = i.value;
    return t;
  }, {})
  let twoFactorCode = notp.totp.gen(Buffer.from(base32Decode(loginData[itemKeyMapper["TOTP"]])))
  return {
    username: itemKeyMapper["username"],
    password: itemKeyMapper["password"],
    twoFactorCode: twoFactorCode
  }
}

const getTwoFactorCode = (twoFactorToken: string) => {
  return notp.totp.gen(Buffer.from(base32Decode(twoFactorToken)))
}

export {
  require1Password,
  getTwoFactorCode
}