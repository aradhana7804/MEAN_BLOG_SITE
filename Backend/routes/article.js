const  express = require('express');
const router = express.Router();
const Article = require('../models/article');
const Subscription = require('../models/subscription');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

filename = '';
const mystorage = multer.diskStorage({

    destination: './uploads',
    filename: (req , file , redirect)=>{
        let date = Date.now();

        let fl = date + '.' + file.mimetype.split('/')[1];
        //786876876786.png
        redirect(null , fl);
        filename = fl;
    }

})

const upload = multer({storage: mystorage})


// router.post('/addartical', upload.any('image') , (req , res)=>{

//     let data = req.body;
//     let article = new Article(data);
//     article.date = new Date();
//     article.image = filename;
//     article.tags = data.tags.split(',');

//     article.save()

//         .then(
//             (saved)=>{
//                 filename = '';
//                 res.status(200).send(saved);
//             }
//         )
//         .catch(
//             err=>{
//                 res.status(400).send(err)
//             }
//         )


// })


router.post('/addartical', upload.any('image'), async (req, res) => {
    try {
        let data = req.body;

        // Handle uploaded file
        if (req.files && req.files.length > 0) {
            filename = req.files[0].filename;
        }

        const article = new Article({
            title: data.title,
            content: data.content,
            description: data.description,
            tags: data.tags.split(','),
            idAuthor: data.idAuthor,
            date: new Date(),
            image: filename
        });

        const savedArticle = await article.save();
        filename = ''; // Reset filename after saving

        // Send email to subscribers
        const subscribers = await Subscription.find({});
        const articleLink = `http://localhost:4200/article/${savedArticle._id}`;

        const filePath = path.join(__dirname, 'emailTemplates', 'newArticleTemplate.html');
        fs.readFile(filePath, 'utf8', async (err, htmlTemplate) => {
            if (err) {
                console.error('Error reading email template:', err);
                return res.status(500).json({ message: 'Server error while reading template' });
            }

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            for (const subscriber of subscribers) {
                const emailContent = htmlTemplate
                    // .replace('{{email}}', subscriber.email)
                    .replace(/{{email}}/g, subscriber.email)
                    // .replace(/\${email}/g, subscriber.email) 
                    
                    .replace(/{{articleTitle}}/g, savedArticle.title)
                    .replace(/{{articleLink}}/g, articleLink);

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: subscriber.email,
                    subject: `📰 New Article Published: ${savedArticle.title}`,
                    html: emailContent
                };

                try {
                    await transporter.sendMail(mailOptions);
                    console.log(`Email sent to ${subscriber.email}`);
                } catch (err) {
                    console.error(`Failed to send email to ${subscriber.email}:`, err);
                }
            }

            res.status(201).json({ message: 'Article created and emails sent to subscribers', savedArticle });
        });

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
});


// router.get('/all', (req , res)=>{

//     Article.find({})
//         .sort({ date: -1 })
//         .then(
//             (articles)=>{
//                 res.status(200).send(articles);
//             }
//         )
//         .catch(
//             (err)=>{
//                 res.status(400).send(err);
//             }
//         )
// })

router.get('/all', (req, res) => {
    Article.find({})
      .then((articles) => {
        // Convert the date strings to Date objects for sorting
        const sortedArticles = articles.sort((a, b) => {
          return new Date(b.date) - new Date(a.date); // Newest first
        });
  
        res.status(200).send(sortedArticles);
      })
      .catch((err) => {
        res.status(400).send(err);
      });
  });

router.get('/getbyid/:id', (req , res)=>{
    
    let id = req.params.id

    Article.findOne({ _id: id })
    .then(
        (articles)=>{
            res.status(200).send(articles);
        }
    )
    .catch(
        (err)=>{
            res.status(400).send(err);
        }
    )

})

router.get('/getbyidauthor/:id', (req , res)=>{

        
    let id = req.params.id

    Article.find({ idAuthor: id })
    .then(
        (articles)=>{
            res.status(200).send(articles);
        }
    )
    .catch(
        (err)=>{
            res.status(400).send(err);
        }
    )
    
})

// router.delete('/delete/:id', (req , res)=>{
    
//     let id = req.params.id

//     Article.findByIdAndDelete({_id: id})
//         .then(
//             (article)=>{
//                 res.status(200).send(article);
//             }
//         )
//         .catch(
//             (err)=>{
//                 res.status(400).send(err);
//             }
//         )

// })

router.delete('/delete/:id', async (req, res) => {
    try {
        let id = req.params.id;
        console.log('Deleting article with ID:', id); // Debugging log

        const article = await Article.findByIdAndDelete(id);

        if (!article) {
            return res.status(404).send({ message: 'Article not found' });
        }

        res.status(200).send({ message: 'Article deleted successfully', article });
    } catch (err) {
        console.error('Error deleting article:', err);
        res.status(500).send({ message: 'Internal server error' });
    }
});

router.put('/update/:id', upload.any('image') , (req , res)=>{
    
    let id = req.params.id
    let data = req.body;
    data.tags = data.tags.split(',');

    if(filename.length > 0){
        data.image = filename;
    }

    Article.findByIdAndUpdate({ _id: id } , data )
        .then(
            (article)=>{
                filename = '';
                res.status(200).send(article);
            }
        )
        .catch(
            (err)=>{
                res.status(400).send(err);
                console.log(err)
            }
        )
 })



module.exports = router;
