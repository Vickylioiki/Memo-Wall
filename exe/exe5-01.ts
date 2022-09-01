
import express from 'express';
import { Request, Response } from 'express'
import expressSession from 'express-session'
import path from 'path'
const app = express();



//server 同 cookies 連接
app.use(
    expressSession({
        secret: 'Hello',
        resave: true,
        saveUninitialized: true,
    }),
)


//
declare module 'express-session' {
    interface SessionData {
        counter?: number
    }
}

//每次reload browser都會經過
app.use((req: Request, _: Response, next) => {
    //check cookies 有冇 counter (每1個browser獨立計算, 所以唔係將counter let 係出面) !important!
    if (!req.session.counter) {
        req.session.counter = 0
    }
    req.session.counter++;
    console.log(`Request ${req.path}`);
    console.log(`counter ${req.session.counter}`);

    next();

})

// app.use(express.static('public'))
app.use(express.static('error')); //auto next (用static先可以包括埋error入面既CSS, JS)



app.use((req, res) => {
    res.sendFile(path.resolve('./error/error.html')) //唔加static, 就淨係拎到HTML, 拎唔到CSS, JS
})




app.listen(8080, () => {
    console.log('listening on port 8080');
})

