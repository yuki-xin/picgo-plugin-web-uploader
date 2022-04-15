import { PicGo } from "picgo"

const guiMenu = (ctx: PicGo) => {
  return [
    {
      label: '打开InputBox',
      async handle(ctx: PicGo, guiApi: any) {
        // do something...
      }
    },
    {
      label: '打开FileExplorer',
      async handle(ctx: PicGo, guiApi: any) {
        // do something...
      }
    },
    // ...
  ]
}

export default guiMenu