const webp = require("webp-converter")
const path = require("path");
const fs = require('fs');

exports.uploadImage = function (request, response) {
    const file = request.file;

    if (file) {
        let originalPath = path.join(__dirname, '../', file.path)

        if (file.mimetype !== "image/png" && file.mimetype !== "image/jpg" && file.mimetype !== "image/jpeg") {
            fs.unlink(originalPath, err => { if (err) console.error(err) })
            return response.status(422).json({message: "Uploaded file have unsupported type"})
        }

        let relativePath = 'storage/uploads/' + Date.now() + 'upload.webp'
        let absolutePath = path.join(__dirname, '../public/', relativePath)

        const result = webp.cwebp(originalPath, absolutePath,"-q 90","-v");
        result.then((res) => {
            return response.status(200).json({ imageUrl: relativePath })
        });
    }
    else {
        response.status(422).json({message: "Uploaded file is null or undefined"})
    }
}