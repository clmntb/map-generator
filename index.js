var express = require("express"),
    cors = require("cors"),
    engine = require("ejs-locals"),
    mongoose = require('mongoose'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    passport = require('passport'),
    Strategy = require('passport-local').Strategy,
    settings = require('./config'),
    app = express();

const crypto = require('crypto');

/*
 *  Database Settings
 */
mongoose.connect(settings.DATABASE);
var db = mongoose.connection;
var Map, Marker, Category;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
    //we're connected!
    var mapSchema = mongoose.Schema({
        name: String,
        base_geoloc: String,
        base_name: String,
        zoom: String,
        style: String,
        markers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Marker' }]
    });
    var markerSchema = mongoose.Schema({
        title: String,
        subtitle: String,
        position: String,
        image: String,
        lien: String,
        description: String,
        _map: { type: mongoose.Schema.Types.ObjectId, ref: 'Map' },
        _category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
    });
    var categorySchema = mongoose.Schema({
        name: String,
        icon: String,
        markers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Marker' }]
    });    
    
    Map = mongoose.model('Map', mapSchema);
    Marker = mongoose.model('Marker', markerSchema);
    Category = mongoose.model('Category', categorySchema);
});


/*
 *  View definition
 */
app.engine('ejs', engine);
app.set('views', __dirname + "/views");
app.set('view engine', 'ejs');

/*
 *  Using a static folder to serve js and css
 */
app.use(express.static('public'));

/*
 *  Passport local strategy to provide a username/password login
 *  TODO: Authentication with database user
 */
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({ secret:'MYSECRET_VERY_VERY_SECRET!!!',resave: false, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new Strategy(
    function(username, password, done){
        var hash = crypto.createHmac('sha256', settings.APP_SALT).update(password).digest('hex');
        if (username === settings.APP_USER && hash === settings.APP_PASSWORD){ 
            var user = { id:1,  name: username, authenticated: true };
            return done(null, user); 
        }
        return done(null, false);
    }
));

passport.serializeUser(function(user,done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    done(null, {name:settings.APP_USER, authenticated: true, id:1});
});

app.use(function(req,res,next){
    // No need to authenticate for static routes nor for the login page (redirect loop otherwise
    // TODO: better route exclusion for login page, for now I prefer whitelisting than defining for each route the need of login beforehands.
    if(req.url === "/login" || req.url.substring(0,4) === "/css" || req.url.substring(0,3) === "/js" || req.url.substring(0,7) === "/images" || req.url.substring(0,17) === "/bower_components"){
        return next();
    }
    if(!req.user || !req.user.authenticated){
        return res.redirect("/login");
    }
    return next();
});


/*
 *  Routes
 */
 
/*
 *  Index
 */
app.get("/", function(req, res){
    res.render('index.ejs');
});

/*
 *  Login
 */
app.get("/login", function(req, res){
    res.render('login');
});

app.post("/login", 
    passport.authenticate('local', {failureRedirect: '/login'}),
    function(req,res){
            res.redirect("/");
});

/*
 *  Other
 */
app.get("/maps", function(req, res, next){
    Map.find().sort({_id:-1}).exec(function (err, maps) {
        if (err) return res.end(err);
        res.end(JSON.stringify(maps));
    });
});

app.get("/categories", function(req, res, next){
    Category.find().sort({name:1}).exec(function (err, cats) {
        if (err) return console.error(err);
        res.end(JSON.stringify(cats));
    });
});

app.get("/categories/:id", function(req, res, next){
    var id = req.params.id;
    Category.findById(id).exec(function(err, cat){
        if (err) return console.error(err);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(cat));
    });
});

app.post("/create_map", function(req, res, next){
    var data = req.body;
    res.setHeader('Content-Type', 'application/json');

    var map = new Map({name: data.name});
    map.save(function(err, map){
        if(err) ( res.end(JSON.stringify({result:false})));
        res.end(JSON.stringify({result:true, map:map}));
        
    });
});

app.post("/create_category", function(req, res, next){
    var data = req.body;
    res.setHeader('Content-Type', 'application/json');

    var category = new Category({name: data.name, icon: data.icon});
    category.save(function(err, category){
        if(err) ( res.end(JSON.stringify({result:false})));
        res.end(JSON.stringify({result:true, category:category}));            
    });
});


app.get('/edit_map/:id', function(req, res) {
    var id = req.params.id;
    Map.findById(id).exec(function(err, map){
        Category.find().populate("markers", null, {_map:id} ).exec(function (err, cats) {
            if (err) return console.error(err);
            res.render('edit_map.ejs', {map: map, categories: cats, settings: settings});
        });
    });
});

app.get('/delete_map/:id', function(req, res) {
    var id = req.params.id;
    Map.findById(id).populate("markers").exec(function(err, map){
        map.remove();
        res.end(JSON.stringify({result:true}));    
    });
});

app.post('/edit_category/:id', function(req, res, next){
    var id = req.params.id;
    Category.findById(id).exec(function(err,cat){
        cat.name = req.body.name;
        cat.icon = req.body.icon;
        cat.save(function(err,c){
            res.setHeader("Content-Type", "application/json");
            if (err) res.end(JSON.stringify({result:"error",error:err}));
            res.end(JSON.stringify(c));
        });
    });
});

app.get('/delete_category/:id', function(req, res) {
    var id = req.params.id;
    Category.findById(id).exec(function(err, category){
        category.remove();
        res.end(JSON.stringify({result:true}));    
    });
});

app.post('/edit_map/:id', function(req, res, next){
    Map.findById(req.params.id, function(err, map){
        var data =req.body;
        console.log(data);
        res.setHeader('Content-Type', 'application/json');
        if (data.name){
            map.name = data.name;
        }
        if (data.base_name){
            console.log("Updating base_name to "+ data.base_name);
            map.base_name = data.base_name;
        }
        if (data.base_geoloc){
            console.log("Updating base_geoloc to "+ data.base_geoloc);
            map.base_geoloc = data.base_geoloc;
        }
        if (data.zoom){
            console.log("Updating zoom to "+ data.zoom);
            map.zoom = data.zoom;
        }
        if (data.style){
            console.log("Updating style");
            map.style = data.style;
        }
            
        map.save(function(err, map){
            if(err) ( res.end(JSON.stringify({result:false})));
            console.log(map);
            res.end(JSON.stringify({result:true}));
        });
    });
});

app.post('/edit_map/:id/add_marker', function(req, res, next){
    Map.findById(req.params.id, function(err, map){
        res.setHeader('Content-Type', 'application/json');

        if(err) res.end(JSON.stringify({result:false, error:err}));
        
        var data = req.body;
        console.log(data);
        
        Category.findById(data.category, function(err, cat){
            if(err) res.end(JSON.stringify(err));
            var marker = new Marker({
                _map: map._id,
                _category: cat._id,
                title: data.title,
                subtitle: data.subtitle,
                position: data.position,
                image: data.image,
                lien: data.lien,
                description: data.description
            });
            
            marker.save(function(err, m){
                if(err) ( res.end(JSON.stringify({result:false})));
                map.markers.push(m);
                map.save();
                
                if (cat){
                    cat.markers.push(m);
                    cat.save();
                }
                                    
                console.log(m);
                res.end(JSON.stringify({marker:m,category:cat}));                
            });
        });            
    });
});

app.get('/edit_map/:id/delete_marker/:mid', function(req,res,next){
    Map.findById(req.params.id).populate("markers",null,{ _id: req.params.mid}).exec(function(err,map){
        if(err) res.end(JSON.stringify({result:false,error:err}));
        map.markers[0].remove();
        res.end(JSON.stringify({result:true}));
    });
});

app.get('/view_result/:id', function(req,res, next){
    var id = req.params.id;
    Map.findById(id).exec(function(err, map){
        Category.find().populate("markers", null, {_map:id} ).exec(function (err, cats) {
            if (err) return console.error(err);
            res.setHeader("Access-Control-Allow-Origin","http://artesane.com");
            
            var result = new Array();
            for(var i=0; i< cats.length; i++){
                if (cats[i].markers.length > 0){
                    result.push(cats[i]);
                }
            }
            res.render('view_map_result.ejs', {map: map, categories: result, settings: settings});
        });
    });
});


/*
 *  Fire up the server !
 */
app.listen(settings.SERVER_PORT, settings.SERVER_HOST, function(){
    console.log("Web server listening on port "+ settings.SERVER_PORT);
});
