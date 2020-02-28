const express = require("express");
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;
const logger = require('morgan');
const cors = require('cors');
const passport = require('passport');
const User = require('./server/api/user/user');


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false, limit: '5mb' }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(passport.initialize());
app.use(passport.session())
app.use('/api/v1/user', User);

const db = require('./server/helper/keys').mongoURI;
mongoose.connect(db).then(() => console.log('Database is ready')).catch(
    err => console.log(err));
require('./server/helper/passport')(passport)

app.get('/', (req, res) => {
    res.status(200).json({ error: false, message: 'Greetings from Sendus' })
});


app.listen(PORT, () => {
    console.log(`App listening on ${PORT}`)
});
