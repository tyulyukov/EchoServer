let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let cors = require('cors');
let bodyParser = require('body-parser');
let multer = require('multer');
let httpDebug = require('debug')('echo:router');
require("dotenv").config();

let indexRouter = require('./routes/index');
let mediaConverterRouter = require('./routes/media-converter');
let usersRouter = require('./routes/users');
let chatsRouter = require('./routes/chats');
let profileRouter = require('./routes/profile');

let app = express();

app.use((req, res, next)=> {
    if (!req.url.startsWith('/storage/'))
        httpDebug(req.method + ' ' + req.url)
    next();
})
app.use(cors({origin: '*'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const storageConfig = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/tmp");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
app.use(multer({storage:storageConfig}).single("file"));

let authController = require('./controllers/auth')
app.use(authController.middlewareAuth)

app.use('/', indexRouter);
app.use('/media', mediaConverterRouter);
app.use('/users', usersRouter);
app.use('/chats', chatsRouter);
app.use('/profile', profileRouter);

app.post('/auth/login', authController.login);
app.post('/auth/register', authController.register);
app.get('/auth/jwt', authController.confirmJwt);

module.exports = app;
