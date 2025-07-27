// const express = require('express');
// const articleApi = require('./routes/article');
// const authorApi = require('./routes/author');
// const cors = require('cors')
// require('./config/connect');

// const app = express();
// app.use(express.json());
// app.use(cors());

// app.use('/article' , articleApi);
// app.use('/author' , authorApi);

// app.use('/getimage' , express.static('./uploads'));


// app.listen(3000, ()=>{
//     console.log('server work');
// })



const express = require('express');
const articleApi = require('./routes/article');
const authorApi = require('./routes/author');
const subscriptionApi= require('./routes/subscription')



// const auth=require('./middleware/auth')
const cookieParser = require('cookie-parser');
const cors = require('cors')

require('./config/connect');

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:4200', // Adjust frontend URL
    credentials: true
  }));
app.use(cookieParser());

app.use('/article' , articleApi);
app.use('/author' , authorApi);
app.use('/article' , subscriptionApi);

app.use('/getimage' , express.static('./uploads'));


app.listen(3000, ()=>{
    console.log('server work');
})