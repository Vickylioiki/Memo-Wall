
import express from 'express';
import { Request, Response } from 'express'
import expressSession from 'express-session'
import path from 'path'
import jsonfile from 'jsonfile';
import formidable from 'formidable';
import fs from 'fs';




const uploadDir = 'uploads'
fs.mkdirSync(uploadDir, { recursive: true })

const app = express();
app.use(express.urlencoded({ extended: true }));

const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFiles: 1,
    maxFileSize: 200 * 1024 ** 2, // the default limit is 200KB
    filter: part => part.mimetype?.startsWith('image/') || false,
    //jpg, png 既mimetype都係/image開頭, 即只拎image既file
})


app.use(
    expressSession({
        secret: 'MemoWall',
        resave: true,
        saveUninitialized: true,
    }),
)  //default next ( )


declare module 'express-session' {
    interface SessionData {
        user?: string;
        isLoggedIn?: boolean;
    }
}



app.post('/create', (req: Request, res: Response) => {
    try {
        form.parse(req, async (err, fields, files) => {
            let imageFile: any = ""; //因為有可能係null
            let file = Array.isArray(files.image) ? files.image[0] : files.image; //如果多過一個file upload, file 就會係一串array
            //upload file都要check, 有機會upload多過一個file(會以array存), 
            //如果係Array就淨係拎第1個file, 即file.image[0], 
            //如果只有一個file, 即files.image
            console.log(file);
            if (file) {
                imageFile = file.originalFilename
            }
            const dir = path.join(__dirname, 'memo.json');
            let memoJson = await jsonfile.readFileSync(dir);
            let contentFile = fields.content
            memoJson.push({ content: contentFile, image: imageFile })
            console.log(memoJson);

            jsonfile.writeFileSync(path.join(__dirname, 'memo.json'), memoJson, { spaces: 2 });
            res.status(200).send('Success')
            return;
        })
    } catch (err) {
        res.status(404).send('Fail')
    }

})

app.get('/memos', async (req: Request, res: Response) => {
    try {
        const dir = path.join(__dirname, 'memo.json');
        let memoJson = await jsonfile.readFileSync(dir);
        res.json(memoJson)
    } catch (err) {
        res.status(404).send('Fail')
    }


})


app.post('/login', async (req, res) => {
    const userinfo = await jsonfile.readFileSync(path.join(__dirname, 'users.json'));
    const inputName = req.body.username;
    const inputPassword = req.body.password;
    for (let user of userinfo) {
        if (user.username === inputName && user.password === inputPassword) {
            req.session.user = inputName;
            req.session.isLoggedIn = true;
            res.redirect('/admin.html')
            return; // 第1個中就可以stop

        }
    }
    req.session.user = " ";
    req.session.isLoggedIn = false;
    res.redirect('/index.html?msg=Login_failed') //用query show反login fail
})


const isLoggedIn = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
) => {
    if (req.session.isLoggedIn) {
        next(); //要( )
        return;
    }
    res.redirect('/index.html');
    return;

}


app.use(express.static('public'));


app.use(express.static('error')); //auto next (用static先可以包括埋error入面既CSS, JS)

//admin.html should be inside protected
app.use(isLoggedIn, express.static('protected'))



app.use((req, res) => {
    res.sendFile(path.resolve('./error/error.html')) //唔加static, 就淨係拎到HTML, 拎唔到CSS, JS
})




app.listen(8080, () => {
    console.log('listening on port 8080');
})

