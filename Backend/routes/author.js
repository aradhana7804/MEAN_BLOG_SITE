const express = require('express');

const router = express.Router();


const Author = require('../models/author');
// const verifyToken =require('../middleware/auth')
const Article = require('../models/article');
const multer = require('multer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');


dotenv.config();

const resetPasswordSecret = process.env.RESET_PASSWORD_SECRET;

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


router.post('/register' , upload.any('image') , (req, res)=>{

    data = req.body;
    author = new Author(data);

    author.image = filename;

    salt = bcrypt.genSaltSync(10);
    author.password = bcrypt.hashSync(data.password , salt);


    author.save()
        .then(
            (savedAuthor)=>{
                filename = "";
                res.status(200).send(savedAuthor);
            }
        )
        .catch(
            err=>{
                res.send(err)
            }
        )


})


router.post('/login' , (req, res)=>{
    
    let data = req.body;

    Author.findOne({email: data.email})
        .then(
            (author)=>{
                let valid = bcrypt.compareSync(data.password , author.password);
                if(!valid){
                    res.send('email or password invalid');
                }else{

                    let payload = {
                        _id: author._id,
                        email: author.email,
                        fullname: author.name + ' ' + author.lastname
                    }

                    let token = jwt.sign(payload , '123456789');

                    res.send({ myToken: token })

                }

            }


        )
        .catch(
            err=>{
                res.send(err);
            }
        )



})


router.get('/all' , (req, res)=>{
    
    Author.find({})
    .then(
        (authors)=>{
            res.status(200).send(authors);
        }
    )
    .catch(
        (err)=>{
            res.status(400).send(err);
        }
    )

})

router.get('/getbyid/:id' , (req, res)=>{
    let id = req.params.id

    Author.findOne({ _id: id })
    .then(
        (author)=>{
            res.status(200).send(author);
        }
    )
    .catch(
        (err)=>{
            res.status(400).send(err);
        }
    )
})
// router.get('/getbyid/:id', verifyToken, async (req, res) => {
//     try {
//         let id = req.params.id;
//         const author = await Author.findOne({ _id: id });

//         if (!author) {
//             console.log("404");
//             return res.status(404).json({ message: 'Author not found' });
            
//         }

//         res.status(200).json(author);
//     } catch (err) {
//         res.status(400).json({ message: 'Error fetching author', error: err });
//         console.log("4552");
//     }
// });

router.delete('/deleteauthor/:id' , (req, res)=>{
    let id = req.params.id

    Author.findByIdAndDelete({_id: id})
        .then(
            (author)=>{
                res.status(200).send(author);
            }
        )
        .catch(
            (err)=>{
                res.status(400).send(err);
            }
        )
})



router.get('/countPublishedPosts/:authorId', async (req, res) => {
    try {
        const authorId = req.params.authorId;
        const count = await Article.countDocuments({ author: authorId, published: true });
        res.status(200).json({ publishedPosts: count });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching published posts count', details: err });
    }
});


router.put('/update-profile/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, lastname, email, about } = req.body;
        let updateData = { name, lastname, email, about };

        // If a new image is uploaded, update the image field
        if (req.file) {
            updateData.image = filename; // Reusing the global 'filename' from multer
        }

        const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!updatedAuthor) {
            return res.status(404).json({ message: "Author not found!" });
        }

        res.json({ message: "Profile updated successfully!", author: updatedAuthor });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.put('/change-password', async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const token = req.cookies['token']; // Corrected to lowercase
  
  
      if (!token) {
        return res.status(401).json({ message: 'Token not found in cookies' });
      }
  
      let decoded;
      try {
        decoded = jwt.verify(token, '123456789');
      } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
  
      const author = await Author.findById(decoded._id);
      if (!author) {
        return res.status(404).json({ message: 'Author not found' });
      }
  
      const isMatch = bcrypt.compareSync(currentPassword, author.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
  
      const salt = bcrypt.genSaltSync(10);
      author.password = bcrypt.hashSync(newPassword, salt);
  
      await author.save();
      res.status(200).json({ message: 'Password changed successfully!' });
    } catch (error) {
      console.error('Error in change-password:', error);
      res.status(500).json({ message: 'Error changing password', error });
    }
  });


// Forgot Password Request
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await Author.findOne({ email: new RegExp('^' + email + '$', 'i') });

        if (!user) {
            return res.status(404).json({ status: false, msg: 'Email not found' });
        }

        const resetToken = jwt.sign({ email: user.email }, resetPasswordSecret, { expiresIn: '15m' });
        const resetLink = `http://localhost:4200/reset-password/${resetToken}`;

        const filePath = path.join(__dirname, 'emailTemplates', 'resetPasswordTemplate.html');
        fs.readFile(filePath, 'utf8', (err, htmlData) => {
            if (err) {
                console.error('Error reading HTML template:', err);
                return res.status(500).json({ status: false, msg: 'Server error' });
            }

            const emailHtml = htmlData
                .replace('{{email}}', user.email)
                .replace(/{{resetLink}}/g, resetLink);

            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: 'Password Reset Request',
                html: emailHtml
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Error sending email:', err);
                    return res.status(500).json({ status: false, msg: 'Failed to send email' });
                }
                res.json({ status: true, msg: 'Reset link sent successfully' });
            });
        });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ status: false, msg: 'Server error' });
    }
});

// Password Reset Endpoint
router.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, resetPasswordSecret);
        const user = await Author.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ status: false, msg: 'Invalid or expired token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ status: true, msg: 'Password reset successful' });
    } catch (err) {
        // console.error('Server error:', err);
        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({ status: false, msg: 'Token expired' });
        }
        res.status(500).json({ status: false, msg: 'Server error' });
    }
});


  


module.exports = router;