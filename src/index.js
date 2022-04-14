const notp = require('notp')
const base32 = require('thirty-two')
const onepasswd = require('@1password/connect')

module.exports = (ctx) => {
  const register = () => {
    ctx.helper.uploader.register('halo-blog-uploader', {
      handle,
      name: 'Halo 博客图床',
      config: config
    })
  }
  const handle = async function (ctx) {
    let userConfig = ctx.getConfig('picBed.halo-blog-uploader')
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
        image = Buffer.from(imgList[i].base64Image, 'base64')
      }
      ctx.log.info("正在查找配置")
      const postConfig = postOptions(image, customHeader, customBody, url, paramName, imgList[i].fileName)
      ctx.log.info(postConfig)
      let body = null
      try {
        body = await ctx.Request.request(postConfig)
      } catch (err) {
        ctx.log.info(err)
        if (err.response.statusCode === 401) {
          ctx.log.info("未认证，正在登录...")
          let token = await login(username, password, twoFactorToken, loginUrl)
          if (token === null) {
            return
          }
          ctx.saveConfig({
              'picBed.halo-blog-uploader.adminAuthorization': token
          })
          ctx.log.info(ctx.getConfig('picBed.halo-blog-uploader'))
          body = await ctx.Request.request(postOptions(image, customHeader, customBody, url, paramName, imgList[i].fileName))
        }
      }
      delete imgList[i].base64Image
      delete imgList[i].buffer
      if (!jsonPath) {
        imgList[i]['imgUrl'] = body
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

  const postOptions = (image, customHeader, customBody, url, paramName, fileName) => {
    let headers = {
      contentType: 'multipart/form-data',
      'User-Agent': 'PicGo',
      'Admin-Authorization': ctx.getConfig('picBed.halo-blog-uploader.adminAuthorization')
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
      formData: formData
    }
    opts.formData[paramName] = {}
    opts.formData[paramName].value = image
    opts.formData[paramName].options = {
      filename: fileName
    }
    return opts
  }

  const login = async (username, password, twoFactorToken, loginUrl) => {
    let headers = {
      contentType: 'applciation/json',
      'User-Agent': 'PicGo'
    }
    let requestBody = {
      username: username,
      password: password
    }
    let twoFactorCode = null
    if (twoFactorToken) {
      twoFactorCode = notp.totp.gen(base32.decode(twoFactorToken))
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
    ctx.log.info(typeof(body))
    if (body.status !== 200) {
      ctx.emit('notification', {
        title: '登录失败',
        body: '请检查登录设置'
      })
      return null
    }
    ctx.log.info("登录成功~！" + body.data.access_token)
    return body.data.access_token
  }

  const require1Password = async (url, token, itemName, itemKeyMapper) => {
    const op = onepasswd.OnePasswordConnect({
      serverURL: url,
      token: token,
      keepAlive: true
    });
    let allVaults = await op.listVaults();
    const namedItem = await op.getItemByTitle(allVaults[0].id, itemName);
    const loginData = namedItem.fields.reduce((t, i) => {
      t[i.label] = i.value;
      return t;
    }, {})
    let twoFactorCode = notp.totp.gen(base32.decode(loginData[itemKeyMapper["TOTP"]]))
    return {
      username: itemKeyMapper["username"],
      password: itemKeyMapper["password"],
      twoFactorCode: twoFactorCode
    }
  }

  const config = ctx => {
    let userConfig = ctx.getConfig('picBed.halo-blog-uploader')
    if (!userConfig) {
      userConfig = {}
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
  return {
    uploader: 'halo-blog-uploader',
    // transformer: 'web-uploader',
    // config: config,
    register

  }
}
