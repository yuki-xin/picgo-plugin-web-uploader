import { IPicGo } from "picgo"
import { IPluginConfig } from 'picgo/dist/utils/interfaces'

export interface IHaloPluginConfig {
  url: string
  login: string
  paramName: string
  jsonPath: string
  customHeader: string
  customBody: string
  twoFactorToken?: string
  username?: string
  password?: string
  adminAuthorization: string
}

const config = (ctx: IPicGo): IPluginConfig[] => {
  let userConfig = ctx.getConfig<IHaloPluginConfig>('picBed.halo-blog-uploader')
  if (!userConfig) {
    userConfig = {
      url: '',
      login: '',
      paramName: '',
      jsonPath: '',
      customHeader: '',
      customBody: '',
      adminAuthorization: '',
    }
  }
  return [
    {
      name: 'url',
      type: 'input',
      default: userConfig.url,
      required: true,
      message: 'API地址',
      alias: 'API地址'
    },
    {
      name: 'login',
      type: 'input',
      default: userConfig.login,
      required: true,
      message: '登录 url 地址',
      alias: '登录 url 地址'
    },
    {
      name: 'paramName',
      type: 'input',
      default: userConfig.paramName,
      required: true,
      message: 'POST参数名',
      alias: 'POST参数名'
    },
    {
      name: 'jsonPath',
      type: 'input',
      default: userConfig.jsonPath,
      required: false,
      message: '图片URL JSON路径(eg: data.url)',
      alias: 'JSON路径'
    },
    {
      name: 'customHeader',
      type: 'input',
      default: userConfig.customHeader,
      required: false,
      message: '自定义请求头 标准JSON(eg: {"key":"value"})',
      alias: '自定义请求头'
    },
    {
      name: 'customBody',
      type: 'input',
      default: userConfig.customBody,
      required: false,
      message: '自定义Body 标准JSON(eg: {"key":"value"})',
      alias: '自定义Body'
    },
    {
      name: 'twoFactorToken',
      type: 'input',
      default: userConfig.twoFactorToken,
      required: false,
      message: '两步验证的 Token，请获取',
      alias: '两步认证'
    },
    {
      name: 'username',
      type: 'input',
      default: userConfig.username,
      required: true,
      message: '登录要使用的用户名',
      alias: '用户名'
    },
    {
      name: 'password',
      type: 'input',
      default: userConfig.password,
      required: true,
      message: '登录使用的密码',
      alias: '密码'
    },
    {
      name: 'adminAuthorization',
      type: 'input',
      default: userConfig.adminAuthorization,
      required: false,
      message: '两步认证获取到的 token',
      alias: '管理员token'
    }
  ]
}

export default config