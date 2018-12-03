// Server Internet Shop v 0.1 created by Sergiy Bosatskiy
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const formidable = require('formidable');
const credentials = require('./credentials');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();
const Items = require('./models/items');
const Categorys = require('./models/categorys');

//configurations
app.set('port', process.env.PORT || 7070);
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser(credentials.cookieSecret));
app.use(session({ resave: false, saveUninitialized: false, secret: credentials.cookieSecret }));
switch (app.get('env')){
    case 'development': mongoose.connect(credentials.mongo.development.connectionString).then(
        () => { console.log('MongoDB connect SUCCESSFUL') },
        err => { console.log(`Помилка з'єднання з базою данних ${err}`)}
    );
    break;
    case 'production': mongoose.connect(credentials.mongo.production.connectionString).then(
        () => { console.log('MongoDB connect SUCCESSFUL') },
        err => { console.log(`Помилка з'єднання з базою данних ${err}`)}
    );
    break;
    default: throw new Error('Невідоме середовище виконання: ' + app.get('env'));
};
app.use(bodyParser.urlencoded({ extended: true }));
let categorys = '';
function categoryupdate() {
    Categorys.find({}, function (err, items) {
    let htm = '', subm = '', clindex = 0;
    for (item of items){ subm = ''; clindex++;
        if (item.subCat !== {}) {
            for (sub in item.subCat){
              subm += `<li><a href="${sub}">${item.subCat[sub]}</a></li>`
            };
        } else { subm = ''};
        htm += `<li>
                        <input type="checkbox" name="toggle" class="toggleSubmenu" id="sub_m1-${clindex}">
                        <a href="${item.mainCatUrl}">${item.mainCat}</a>
                        <label for="sub_m1-${clindex}" class="toggleSubmenu"><i class="fa"></i></label>
                <ul>${subm}</ul>
                </li>`;
    };
    categorys = htm; console.log(htm)
});};
categoryupdate();
const handlebars = require('express-handlebars').create({ defaultLayout: 'main', helpers: {
        section: function (name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;},
        category: function () {
            return categorys;
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


//routing


app.get('/admin', function (req, res) {
    res.render('admin/admin');
});

app.post('/admin/items', function (req, res) {
   Items.find({}, function (err, item) {
      res.json(item);
   });
});

app.post('/additem', function (req, res) {
   const file = new formidable.IncomingForm();
   file.encoding = 'utf-8';
   file.uploadDir = path.join(__dirname, 'public/image');
   file.parse(req, function (err, fields, files) {
     //  console.log(util.inspect({fields: fields, files: files}));
       let imagearr = [];
       let i = 0;
       for( picturecount in files){

           imagearr[i] = path.join('image', path.join(fields.seo, files[picturecount].name));

           if (files[picturecount].size !== 0){
               let dir = path.join('public', path.join('image', fields.seo));
           if (!fs.existsSync(dir)){fs.mkdirSync(dir);};
               fs.renameSync(files[picturecount].path, path.join('public', imagearr[i]));};
          i++;
       };
       const item = new Items({
           _id: new mongoose.Types.ObjectId(),
           title: fields.title,
           seo: fields.seo,
           price: { current: fields.price },
           description: fields.descript,
           about: fields.about,
            image: imagearr,
       });

       item.save().then(() => {categoryupdate(); res.redirect(303, '/admin')});
   });

});

app.post('/admin/deleteitem', (req, res) => {
   Items.remove({ _id: req.body.id }, function (err) {
       if (err) { throw err;
       console.error(err.stack);};
       categorys = '';
       categoryupdate();
       res.send('success');
   });
});

//створення марштрутів для товарів з бази данних
app.get('/:url', function (req, res) {
    Items.find({ seo: req.params.url }, function (err, item) {
        if (err) { throw err; console.error(err.stack) };
        if (item.length>0) {

            res.render('item', { title: item[0].title, price: item[0].price.current, about: item[0].about, image: item[0].image, mainimage: item[0].image[0] });
        } else {
            res.status(404); res.render('404', { title: 'Помилка 404. Сторінка не знайдена' }); };
    });
});

//error 404
app.use(function (req, res, next) {
    res.status(404);
    res.render('404', { title: 'Помилка 404. Сторінка не знайдена' });
});
//error 500
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});
app.listen(app.get('port'), function () {
    console.log(`Server start on port: ${app.get('port')}  Environment: ${app.get('env')}`);
});