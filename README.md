# picgo-plugin-halo-blog-uploader

plugin for [PicGo](https://github.com/Molunerfinn/PicGo)

<p align="center">
      <a href="https://picgo.github.io/PicGo-Core-Doc/" target="_blank" rel="noopener noreferrer">
            <img width="100" src="https://raw.githubusercontent.com/Molunerfinn/test/master/picgo/New%20LOGO-150.png" alt="PicGo Logo">
      </a>
      <a href="https://halo.run" target="_blank" rel="noopener noreferrer">
            <img width="90" src="https://halo.run/logo" alt="Halo logo">
      </a>
</p>

PicGo 的 [Halo 博客](https://github.com/halo-dev/halo) 上传插件

forked from [PicGo-WebUploader](https://github.com/yuki-xin/picgo-plugin-web-uploader)

## 功能
- 上传前登录
- 两步认证

## 使用

### 图床配置

- url: 图床上传API地址
- login: 登录 url 地址
- paramName: POST参数名
- jsonPath: 图片URL所在返回值的JsonPath(eg:data.url)
- customHeader: 自定义请求头 标准JSON(eg: {"key":"value"}
- customBody: 自定义Body 标准JSON(eg: {"key":"value"})
- twoFactorToken: 两步认证的 token
- username: 登录要使用的用户名
- password: 登录使用的密码

## 注意
两步认证需要提供密钥

注意：请不要随意泄露该密钥，如果该密钥被获取到，两步认证的 code 码会被随意生成。

获取方式：登录管理后台，在个人资料处重新生成两步认证密钥，并将该密钥保存下来，填写到配置中。