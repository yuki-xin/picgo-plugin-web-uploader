// const logger = require('@varnxy/logger')

module.exports = (ctx) => {
  const register = () => {
    ctx.helper.uploader.register('web-uploader', {
      handle,
      name: '自定义Web图床',
      config: config
    })
  }
  const handle = async function (ctx) {
    let userConfig = ctx.getConfig('picBed.web-uploader')
    if (!userConfig) {
      throw new Error('Can\'t find uploader config')
    }
    const url = userConfig.url
    const paramName = userConfig.paramName
    const jsonPath = userConfig.jsonPath
    try {
      let imgList = ctx.output
      for (let i in imgList) {
        let image = imgList[i].buffer
        if (!image && imgList[i].base64Image) {
          image = Buffer.from(imgList[i].base64Image, 'base64')
        }
        const postConfig = postOptions(image, url, paramName, imgList[i].fileName)
        let body = await ctx.Request.request(postConfig)

        delete imgList[i].base64Image
        delete imgList[i].buffer
        if (!jsonPath) {
          imgList[i]['imgUrl'] = body
        } else {
          body = JSON.parse(body)
          let imgUrl = body[jsonPath]
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
    } catch (err) {
      ctx.emit('notification', {
        title: '上传失败',
        body: '请检查服务端或配置'
      })
    }
  }

  const postOptions = (image, url, paramName, fileName) => {
    const opts = {
      method: 'POST',
      url: url,
      headers: {
        contentType: 'multipart/form-data',
        'User-Agent': 'PicGo'
      },
      formData: {}
    }
    opts.formData[paramName] = {}
    opts.formData[paramName].value = image
    opts.formData[paramName].options = {
      filename: fileName
    }
    return opts
  }

  const config = ctx => {
    let userConfig = ctx.getConfig('picBed.web-uploader')
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
      }
    ]
  }
  return {
    uploader: 'web-uploader',
    // transformer: 'web-uploader',
    // config: config,
    register

  }
}
