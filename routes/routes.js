const express = require('express');
const router = express.Router();
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path'); 
const fs = require('fs');

const Product = require('../models/Product')
const User = require('../models/User')
const Cart = require('../models/Cart')
const Currency = require('../models/Currency');
const Other = require('../models/Other')

function loadTranslation(language) {
    const translation = fs.readFileSync(`./public/languages/${language}.json`);
    return JSON.parse(translation);
  }
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images') 
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage })
const authenticateUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect('/login'); 
    }
  
    jwt.verify(token, 'secret_key', (err, user) => {
      if (err) {
        return res.redirect('/login');
      }
      req.user = user;
      next();
    });
  };
  const language = (req, res, next) => {
    const language =  req.query.lang  || 'en';
    const translation = loadTranslation(language);
    req.session.language = language; 
    res.locals.translation = translation;
    res.locals.currentLanguage = language;
    next();
  }
  const authorizeAdmin = (req, res, next) => {
    if (!req.user || !req.user.role) {
        return res.status(403).send('Forbidden'); 
    }
    next();
};

router.post('/change-language', (req, res) => {
    const language = req.body.language;
    req.session.language = language; 
    var currentUrl = req.headers.referer || '/';
    const langQueryParamIndex = currentUrl.indexOf('?lang=');
    if (langQueryParamIndex !== -1) {
        currentUrl = currentUrl.substring(0, langQueryParamIndex) + `?lang=${language}`;
    } else {
        const separator = currentUrl.includes('?') ? '&' : '?';
        currentUrl = `${currentUrl}${separator}lang=${language}`;
    }
    res.redirect(currentUrl);
});

router.get('/', (req, res) => {
    res.status(200).render('register');
});
router.get('/logout', (req, res) => {
    res.status(200).redirect('/')
});

router.get('/index', authenticateUser, language, async(req, res)=>{
    try {
        const userId = req.user.userId; 
        const user = await User.findById(userId);
        const products = await Product.find()
        const currentLanguage = req.session.language || 'en';
        res.render('index', { userId: user.userId, isAdmin: req.user.role, products, lang: res.locals.translation, currentLanguage });
    } catch (err) {
        res.status(500).send(err);
    }
})
router.get('/products/:productId', authenticateUser, language, async(req, res)=>{
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('product not found');
        }
        const currentLanguage = req.session.language || 'en';
        res.status(200).render('product', {userId: null, isAdmin:false, product, lang: res.locals.translation, currentLanguage });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

router.get('/cart', authenticateUser, language, async(req, res)=>{
    try {
        const userId = req.user.userId;
        const enrollments = await Cart.find({ user: userId }).populate('product');
        const products = enrollments.map(enrollment => enrollment.product);
        const currentLanguage = req.session.language || 'en'; 
        res.status(200).render('mytcart', { userId, isAdmin: req.user.role, products, lang: res.locals.translation, currentLanguage});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})
router.post('/products/:productId/addcart', authenticateUser, language , async(req, res)=>{
    try {
        const productId = req.params.productId;
        const userId = req.user.userId;
        const existingEnrollment = await Cart.findOne({ user: userId, product: productId });
        if (existingEnrollment) {
            return res.status(400).send('You are already add product in this cart.');
        }
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('product not found.');
        }
        
        const enrollment = new Cart({
            user: userId,
            product: productId
        });
        await enrollment.save()

        const enrollments = await Cart.find({ user: userId }).populate('product');
        const currentLanguage = req.session.language || 'en'; 
        res.status(200).redirect(`/cart?lang=${currentLanguage}`);
     } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            res.status(404).send({message: 'Invalid username'})
            return; 
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            res.status(500).send({ message: 'Invalid password' });
            return; 
        }
        const token = jwt.sign({ 
            userId: user._id, 
            username: user.username, 
            role: user.isAdmin, 
        }, 'secret_key');
        res.cookie('token', token);
        req.session.user = user;
        res.status(200).redirect('/index'); 
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).send('An error occurred while logging in');
    }
})


router.get('/login', (req, res) => {
    res.status(200).render('login');
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ username, email});
        if (existingUser) {
            res.status(500).render("register.ejs", { errorMessage: "Username already exists" });
            return; 
        }
        let isAdmin = false;
        if (password === "zhanarysasan" && email === "zhanarys@gmail.com" && username === "zhanarys") {
            isAdmin = true;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email,password:hashedPassword, isAdmin });
        await newUser.save();

        req.session.userId = newUser._id;
        res.redirect(`/login`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


router.get('/admin', authenticateUser, authorizeAdmin, language, async (req, res) => {
    try {
        const users = await User.find();
        const currentLanguage = req.session.language || 'en';

        res.status(200).render('admin', { userId: req.user._id, isAdmin: req.user.isAdmin, users: users, lang: res.locals.translation, currentLanguage });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
});


router.post('/admin/add', authenticateUser, authorizeAdmin,language, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, isAdmin: false });
        await newUser.save();
        const currentLanguage = req.session.language || 'en';

        res.status(200).redirect(`/admin?lang=${currentLanguage}`)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/admin/update', authenticateUser, authorizeAdmin, language, async(req, res) => {
    const { userId, newUsername, newEmail, newPassword } = req.body;   
     try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (newUsername) {
            user.username = newUsername;
        }
        if (newEmail) {
            user.email = newEmail;
        }
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }
        await user.save();
        const currentLanguage = req.session.language || 'en';

        res.status(200).redirect(`/admin?lang=${currentLanguage}`)
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/admin/delete', authenticateUser, authorizeAdmin,language,  async (req, res) => {
    try {
        const userId = req.body.deleteUserId;
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).send('User not found');
        }
        const users = await User.find();
        const currentLanguage = req.session.language || 'en';

        res.status(200).redirect(`/admin?lang=${currentLanguage}`)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/admin/products', authenticateUser, authorizeAdmin, language, async (req, res) => {
    try {
        const products = await Product.find();
        const currentLanguage = req.session.language || 'en';
        res.status(200).render('newProduct', {isAdmin: req.user.isAdmin, products: products, lang: res.locals.translation, currentLanguage });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/admin/products', authenticateUser, authorizeAdmin,language, upload.array('images[]'), async (req, res) => {
    try {
        const imageUrls = req.files.map(file => {
            const correctedPath = file.path.replace(/\\/g, '/');
            const newPath = correctedPath.replace('public/', '../');
            return newPath;
        });
        const newProduct = new Product({
            names: req.body.names,
            descriptions: req.body.descriptions,
            images: imageUrls, 
            price: req.body.productPrice,
            category: req.body.category,
            colors: req.body.colors,
            sizes: req.body.sizes,
        });
        const savedProduct = await newProduct.save();

        const currentLanguage = req.session.language || 'en';
        res.status(200).redirect(`/admin/products?lang=${currentLanguage}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/admin/products/update', authenticateUser, authorizeAdmin,language, async (req, res) => {
    try {
        const {productId,  names, descriptions, productPrice,category,  colors,sizes } = req.body;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('product not found');
        }
        if (names) {
            product.names = names.map(name => ({ language: name.language, name: name.name }));
        }
        if (descriptions) {
            product.descriptions = descriptions.map(description => ({ language: description.language, description: description.description }));
        }
        if (productPrice) {
            product.price = productPrice;
        }
        if (category) {
            product.category = category;
        }
        if (colors) {
            product.colors = colors;
        }
        if (sizes) {
            product.sizes = sizes;
        }

        const update = await product.save();
        const currentLanguage = req.session.language || 'en';

        res.status(200).redirect(`/admin/products?lang=${currentLanguage}`)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



router.get('/other', authenticateUser, language, async (req, res) => {
    try {
        let category = req.query.category || "jewelery";
        let apiUrl;
        userId = req.user.userId
        
        if (category === 'jewelery' || category === 'electronics') {
            apiUrl = `https://fakestoreapi.com/products/category/${category}`;
        } else {
            return res.status(400).json({ error: 'Invalid category' });
        }
        const response = await fetch(apiUrl);
        const products = await response.json();
        products.forEach(product => {
            product.user = userId;
        });
        await Other.deleteMany({});
        await Other.create(products); 
        const currentLanguage = req.session.language || 'en';
        res.status(200).render('other', {isAdmin: req.user.isAdmin, products: products, lang: res.locals.translation, currentLanguage });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'An error occurred while fetching products' });
    }
});


router.get("/currency",authenticateUser, language, async (req, res) => {
    try {
      const currentLanguage = req.session.language || 'en';
      res.status(200).render('currency', {isAdmin: req.user.isAdmin,savedCurrency: null, lang: res.locals.translation, currentLanguage });
     } catch (error) {
      console.error(error);
      res.status(500).send("Error fetching weather data");
    }
});
  

router.post("/currency", authenticateUser, language,async (req, res) => {
    try {
        const  currencyCode = req.body.currencyCode;
        const amount = req.body.amount
        const userId = req.user.userId;
        if (!currencyCode || !amount) {
            return res.status(400).json({ error: 'Не указаны все необходимые данные' });
        }
  
        const apiUrl = `https://open.er-api.com/v6/latest/${currencyCode}`;
        const response = await axios.get(apiUrl);
  
        if (response.data && response.data.rates && response.data.rates.USD) {
            const usdAmount = amount * response.data.rates.USD;
  
            const currencyInfo = {
                user: userId,
                currencyCode: currencyCode,
                amount,
                usdAmount
            };
  
            const savedCurrency = await Currency.create(currencyInfo);
  
            const currentLanguage = req.session.language || 'en';
            res.status(200).render('currency', {isAdmin: req.user.isAdmin,savedCurrency: savedCurrency, lang: res.locals.translation, currentLanguage });
    
        } else {
            res.status(400).json({ error: 'Invalid currency' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("Error converting currency");
    }
  });
router.post('/admin/products/delete', authenticateUser, authorizeAdmin,language,  async (req, res) => {
    try {
        const productId = req.body.productId;
        await Cart.deleteMany({ product: productId });

        const deletedProduct = await Product.findByIdAndDelete(productId);
        if (!deletedProduct) {
            return res.status(404).send('Product not found');
        }
        const currentLanguage = req.session.language || 'en';
        res.status(200).redirect(`/admin/products?lang=${currentLanguage}`)
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;