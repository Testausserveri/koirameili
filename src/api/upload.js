import crypto from "crypto"
import path from "path"
import fs from "fs/promises"
import multer from "multer"
import mime from "mime-types"

const uploadDir = path.join(path.resolve(), './.koirameili_tmp/')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype))
        })
    }
})
export const upload = multer({
    storage: storage
})

fs.mkdir(uploadDir, { recursive: true })

export async function cleanUpload(path) {
    console.log("Cleaning up", path)
    await fs.unlink(path)
}


