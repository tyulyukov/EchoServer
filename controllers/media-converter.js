const webp = require("webp-converter")
const path = require("path");
const fs = require('fs');

exports.uploadImage = function (request, response) {
    if (!request.user)
        return response.status(401).json({ message: "Not authorized" })

    const file = request.file;

    if (file) {
        let originalPath = path.join(__dirname, '../', file.path)

        if (file.mimetype !== "image/png" && file.mimetype !== "image/jpg" && file.mimetype !== "image/jpeg" && file.mimetype !== "application/octet-stream") {
            fs.unlink(originalPath, err => { if (err) console.error(err) })
            return response.status(422).json({message: "Uploaded file have unsupported type"})
        }

        let id = Date.now()

        let relativeCompressedPath = 'storage/uploads/compressed/' + id + '_upload.webp'
        let absoluteCompressedPath = path.join(__dirname, '../public/', relativeCompressedPath)
        let relativePath = 'storage/uploads/original/' + id + '_upload_' + file.filename
        let absolutePath = path.join(__dirname, '../public/', relativePath)

        fs.rename(originalPath, absolutePath, function (err) {
            if (err)
                return response.status(500).json({message: "File moving error"})

            const result = webp.cwebp(absolutePath, absoluteCompressedPath,"-q 90","-v");
            result.then((res) => {
                return response.status(200).json({ originalImageUrl: relativePath, imageUrl: relativeCompressedPath })
            });
        })
    }
    else {
        response.status(422).json({message: "Uploaded file is null or undefined"})
    }
}

exports.uploadAvatar = function (request, response) {
    if (!request.userId)
        return response.status(401).json({ message: "Not authorized" })

    const file = request.file;

    if (file) {
        let originalPath = path.join(__dirname, '../', file.path)

        if (file.mimetype !== "image/png" && file.mimetype !== "image/jpg" && file.mimetype !== "image/jpeg" && file.mimetype !== "application/octet-stream") {
            fs.unlink(originalPath, err => { if (err) console.error(err) })
            return response.status(422).json({message: "Uploaded file have unsupported type"})
        }

        let id = Date.now()

        let relativeCompressedPath = 'storage/avatars/compressed/' + id + '_avatar.webp'
        let absoluteCompressedPath = path.join(__dirname, '../public/', relativeCompressedPath)
        let relativePath = 'storage/avatars/original/' + id + '_avatar_' + file.filename
        let absolutePath = path.join(__dirname, '../public/', relativePath)

        fs.rename(originalPath, absolutePath, function (err) {
            if (err)
                return response.status(500).json({message: "File moving error"})

            const result = webp.cwebp(absolutePath, absoluteCompressedPath,"-q 80","-v");
            result.then((res) => {
                return response.status(200).json({ originalAvatarUrl: relativePath, avatarUrl: relativeCompressedPath })
            });
        })
    }
    else {
        response.status(422).json({message: "Uploaded file is null or undefined"})
    }
}