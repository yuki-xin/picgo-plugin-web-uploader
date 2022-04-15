import { IPicGo } from 'picgo'
import config, { IHaloPluginConfig } from './config'
import guiMenu from './gui'
import { getTwoFactorCode } from './twoFactor'

module.exports = (ctx: IPicGo) => {
  const register = () => {
    ctx.helper.uploader.register('halo-blog-uploader', {
      handle,
      name: 'Halo 博客图床',
      config: config
    })
  }

  const handle = async function (ctx: IPicGo) {
    let userConfig = ctx.getConfig<IHaloPluginConfig>('picBed.halo-blog-uploader')
    if (!userConfig) {
      throw new Error('Can\'t find uploader config')
    }
    const url = userConfig.url
    const paramName = userConfig.paramName
    const jsonPath = userConfig.jsonPath
    const customHeader = userConfig.customHeader
    const customBody = userConfig.customBody
  
    // 增加了登录必须的字段
    const twoFactorToken = userConfig.twoFactorToken
    const username = userConfig.username
    const password = userConfig.password
    const loginUrl = userConfig.login
    const token = userConfig.adminAuthorization
  
    ctx.log.info("配置读取完毕")
  
    let imgList = ctx.output
    ctx.log.info("本次上传：" + imgList.length)
    for (let i in imgList) {
      let image = imgList[i].buffer
      if (!image && imgList[i].base64Image) {
        image = Buffer.from(imgList[i].base64Image ?? '', 'base64')
      }
      if (!image) {
        throw new Error('Can\'t find uploader config')
      }
      ctx.log.info("正在查找配置")
      const postConfig = postOptions(image, customHeader, customBody, url, paramName, imgList[i].fileName ?? '')
      ctx.log.info(String(postConfig))
      let body = null
      try {
        body = await ctx.request(postConfig)
      } catch (err: any) {
        ctx.log.info(String(err))
        if (err.response.statusCode === 401) {
          ctx.log.info("未认证，正在登录...")
          let token = await login(username??'', password??'', twoFactorToken??'', loginUrl)
          if (token === null) {
            return
          }
          ctx.saveConfig({
            'picBed.halo-blog-uploader.adminAuthorization': token
          })
          ctx.log.info(ctx.getConfig('picBed.halo-blog-uploader'))
          body = await ctx.request(postOptions(image, customHeader, customBody, url, paramName, imgList[i].fileName ?? ''))
        }
      }
      delete imgList[i].base64Image
      delete imgList[i].buffer
      if (!jsonPath) {
        imgList[i].imgUrl = body
      } else {
        body = JSON.parse(body)
        let imgUrl = body
        for (let field of jsonPath.split('.')) {
          imgUrl = imgUrl[field]
        }
        if (imgUrl) {
          imgList[i]['imgUrl'] = imgUrl
        } else {
          ctx.emit('notification', {
            title: '返回解析失败',
            body: '请检查JsonPath设置'
          })
        }
      }
    }
  }
  
  const postOptions = (image: Buffer, customHeader: any, customBody: any, url: string, paramName: string, fileName: string) => {
    let headers = {
      contentType: 'multipart/form-data',
      'User-Agent': 'PicGo',
      'Admin-Authorization': ctx.getConfig('picBed.halo-blog-uploader.adminAuthorization') as string
    }
    if (customHeader) {
      headers = Object.assign(headers, JSON.parse(customHeader))
    }
    let formData = {}
    if (customBody) {
      formData = Object.assign(formData, JSON.parse(customBody))
    }
    const opts = {
      method: 'POST',
      url: url,
      headers: headers,
      formData : formData as any
    }
    opts.formData[paramName] = {}
    opts.formData[paramName].value = image
    opts.formData[paramName].options = {
      filename: fileName
    }
    return opts
  }
  
  const login = async (username: string, password: string, twoFactorToken: string, loginUrl: string) => {
    let headers = {
      contentType: 'applciation/json',
      'User-Agent': 'PicGo'
    }
    let requestBody = {
      username: username,
      password: password,
      authcode: ''
    }
    let twoFactorCode = null
    if (twoFactorToken) {
      twoFactorCode = getTwoFactorCode(twoFactorToken)
      requestBody.authcode = twoFactorCode
    }
    const opts = {
      method: 'post',
      uri: loginUrl,
      headers: headers,
      json: requestBody
    }
    ctx.log.info(JSON.stringify(opts))
    let body = await ctx.request(opts)
    ctx.log.info(body)
    ctx.log.info(typeof (body))
    if (body.status !== 200) {
      ctx.emit('notification', {
        title: '登录失败',
        body: '请检查登录设置'
      })
      return null
    }
    ctx.log.info("登录成功~" + body.data.access_token)
    return body.data.access_token
  }

  return {
    uploader: 'halo-blog-uploader',
    guiMenu,
    // transformer: 'web-uploader',
    // config: config,
    register
  }
}