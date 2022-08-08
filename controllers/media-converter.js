const webp = require("webp-converter")
const path = require("path");
const fs = require('fs');
const getStream = require('into-stream')
const { BlockBlobClient } = require("@azure/storage-blob");

const getBlobName = () => {
    const identifier = Math.random().toString().replace(/0\./, '') + '-' + Date.now().toString(); // remove "0." from start of string
    return `${identifier}.webp`;
};

const getFileExtension = originalName => {
    return originalName.substring(originalName.lastIndexOf('.') + 1, originalName.length)
}

const validateImageType = mimeType => {
    return mimeType == "image/png" || mimeType == "image/jpg" || mimeType == "image/jpeg" || mimeType == "application/octet-stream"
}

exports.uploadImage = function (request, response) {
    if (!request.user)
        return response.status(401).json({ message: "Not authorized" })

    const file = request.file;

    if (file) {
        if (!validateImageType(file.mimetype)) {
            return response.status(422).json({ message: "Uploaded file have unsupported type" })
        }

        const fileExtension = getFileExtension(file.originalname)

        webp.buffer2webpbuffer(request.file.buffer, fileExtension,"-q 90")
            .then(webpBuffer => {
                const blobName = getBlobName()
                const blobService = new BlockBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING, 'uploads', blobName)
                const webpStream = getStream(webpBuffer)
                const webpStreamLength = webpStream.length

                blobService.uploadStream(webpStream, webpStreamLength)
                    .then(res => {
                        return response.status(200).json({ imageUrl: blobService.url, originalImageUrl: blobService.url })
                    })
                    .catch(err => {
                        console.error(err)
                        return response.status(500).json({ message: "Error corrupted while uploading file to storage" })
                    })
            });
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
        if (!validateImageType(file.mimetype)) {
            return response.status(422).json({ message: "Uploaded file have unsupported type" })
        }

        const fileExtension = getFileExtension(file.originalname)

        webp.buffer2webpbuffer(request.file.buffer, fileExtension,"-q 90")
            .then(webpBuffer => {
                const blobName = getBlobName()
                const blobService = new BlockBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING, 'avatars', blobName)
                const webpStream = getStream(webpBuffer)
                const webpStreamLength = webpStream.length

                blobService.uploadStream(webpStream, webpStreamLength)
                    .then(res => {
                        return response.status(200).json({ avatarUrl: blobService.url, originalAvatarUrl: blobService.url })
                    })
                    .catch(err => {
                        console.error(err)
                        return response.status(500).json({ message: "Error corrupted while uploading file to storage" })
                    })
            });
    }
    else {
        response.status(422).json({ message: "Uploaded file is null or undefined" })
    }
}