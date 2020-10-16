import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();
const port = process.env.PORT || 7000;

app.use(bodyParser.json());
//app.use(express.static(path.join(__dirname, '/build')))
app.use(express.static(path.join(__dirname, '/build')))
/*if (process.env.NODE_ENV === 'production') {
    app.get(/^((?!(api)).)*$/, (req, res) => {
     //   res.sendFile(path.join(__dirname, 'client/build', 'index.html' ))
        res.sendFile(path.join(__dirname, 'index.html' ))
    })
}*/

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '/build')));
    app.get(/^((?!(api)).)*$/, (req, res) => {
        res.sendFile(path.join(__dirname, 'src', 'build', 'index.html'));
    });
}

const start = async() => {
    const client = await MongoClient.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/',{ useNewUrlParser : true, useUnifiedTopology : true}, );
    //const client = await MongoClient.connect('mongodb+srv://mongoUser:mongoPassword@Cluster0.skner.mongodb.net/blog-db?retryWrites=true&w=majority',{ useNewUrlParser : true, useUnifiedTopology : true},);
    const db = client.db('blog-db');

    app.get('/api/articles/:name', async (req,res) => {
        const { name: articleName } = req.params;    
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articleInfo);
    });

    app.post('/api/articles/:name/upvotes', async (req, res) => {
        const articleName = req.params.name;
        //const currentArticle = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name : articleName }, { $inc: { upvotes: 1} });
        const updatedArticle = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticle);
    });

    app.post('/api/articles/:name/comments', async (req, res) => {
        const articleName = req.params.name;
        const { postedBy, text } = req.body;
        await db.collection('articles').updateOne({ name : articleName }, { $push: { comments: { postedBy, text }} });
        const updatedArticle = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticle);        
    });

    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '/build/index.html'));
    })

    app.listen(port, () => console.log(`Server is listening at port ${port}`));
}

start();
