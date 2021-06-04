'use babel'

let ImgHelper
import {CompositeDisposable, File, Directory} from 'atom'

module.exports = (ImgHelper = {

  activate(state) {
    return atom.commands.onWillDispatch(e  => {
      if (e.type === "core:paste") {

        const editor = atom.workspace.getActiveTextEditor()
        if (!editor) { return }

        const clipboard = require("electron").clipboard
        const img = clipboard.readImage()
        if (img.isEmpty()) { return }

        e.stopImmediatePropagation()

        const imgbuffer = img.toPNG()

        const thefile = new File(editor.getPath())
        const assetsDirPath = thefile.getParent().getPath()+"/"+atom.config.get('image-helper.directoryName')

        const crypto = require("crypto")
        const md5 = crypto.createHash('md5')
        md5.update(imgbuffer)

        const filename = `${thefile.getBaseName().replace(/\.\w+$/, '').replace(/\s+/g,'')}-${md5.digest('hex').slice(0,5)}.png`

        this.createDirectory(assetsDirPath, ()=> {
          return this.writePng(assetsDirPath+'/', filename, imgbuffer, ()=> {
            return this.insertUrl(atom.config.get('image-helper.directoryName')+`/${filename}`,editor)
          })
        })

        return false
      }
    })
  },

  createDirectory(dirPath, callback){
    const assetsDir = new Directory(dirPath)

    return assetsDir.exists().then(existed => {
      if (!existed) {
        return assetsDir.create().then(created => {
          if (created) {
            console.log('Success Create dir')
            return callback()
          }
        })
      } else {
        return callback()
      }
    })
  },

  writePng(assetsDir, filename, buffer, callback){
    const fs = require('fs')
    return fs.writeFile(assetsDir+filename, buffer, 'binary',() => {
      console.log('finish clip image')
      return callback()
    })
  },

  insertUrl(url,editor) {
    return editor.insertText(url)
  },

  deactivate() {},

  serialize() {},

  config: {
    directoryName: {
      "default": "assets",
      "type": "string",
      "order": 0
    }
  }
})
