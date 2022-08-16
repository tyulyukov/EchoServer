const getStream = require('into-stream')
const { BlockBlobClient } = require("@azure/storage-blob");
const supportedExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'heic', 'heif']

const getBlobName = originalName => {
    const identifier = Math.random().toString().replace(/0\./, '') + '-' + Date.now().toString(); // remove "0." from start of string
    return `${identifier}.${getFileExtension(originalName)}`;
};

const getFileExtension = originalName => {
    return originalName.substring(originalName.lastIndexOf('.') + 1, originalName.length)
}

const validateImageType = originalName => {
    let extension = getFileExtension(originalName)
    return supportedExtensions.includes(extension);
}

const validateImageSize = size => {
    return size <= 10485760
}

exports.uploadImage = function (request, response) {
    if (!request.user)
        return response.status(401).json({ message: "Not authorized" })

    const file = request.file;

    if (!file)
        return response.status(422).json({message: "Uploaded file is null or undefined"})

    if (!validateImageType(file.originalname))
        return response.status(415).json({ message: "Uploaded file have unsupported type" })

    if (!validateImageSize(parseInt(request.headers["content-length"])))
        return response.status(422).json({ message: "File is too big" })

    const blobName = getBlobName(request.file.originalname)
    const blobService = new BlockBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING, 'uploads', blobName)
    const stream = getStream(request.file.buffer)
    const streamLength = stream.length

    blobService.uploadStream(stream, streamLength)
        .then(res => {
            return response.status(200).json({ imageUrl: blobService.url, originalImageUrl: blobService.url })
        })
        .catch(err => {
            console.error(err)
            return response.status(500).json({ message: "Error corrupted while uploading file to storage" })
        })
}

exports.uploadAvatar = function (request, response) {
    if (!request.userId)
        return response.status(401).json({ message: "Not authorized" })

    const file = request.file;

    if (!file)
        return response.status(422).json({ message: "Uploaded file is null or undefined" })

    if (!validateImageType(file.originalname))
        return response.status(415).json({ message: "Uploaded file have unsupported type" })

    if (!validateImageSize(parseInt(request.headers["content-length"])))
        return response.status(422).json({ message: "File is too big" })

    const blobName = getBlobName(request.file.originalname)
    const blobService = new BlockBlobClient(process.env.AZURE_STORAGE_CONNECTION_STRING, 'avatars', blobName)
    const stream = getStream(request.file.buffer)
    const streamLength = stream.length

    blobService.uploadStream(stream, streamLength)
        .then(res => {
            return response.status(200).json({ avatarUrl: blobService.url, originalAvatarUrl: blobService.url })
        })
        .catch(err => {
            console.error(err)
            return response.status(500).json({ message: "Error corrupted while uploading file to storage" })
        })
}