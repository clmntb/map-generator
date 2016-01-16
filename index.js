var express = require("express"),
    cors = require("cors"),
    engine = require("ejs-locals"),
    mongoose = require('mongoose'),
    qs = require('querystring'),
    app = express();

mongoose.connect('mongodb://localhost/map-generator');
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

app.engine('ejs', engine);
app.set('views', __dirname + "/views");
app.set('view engine', 'ejs');

var port = 8080;

app.get("/", function(req, res, next){
    res.render('index.ejs');
});

app.get("/maps", function(req, res, next){
    Map.find(function (err, maps) {
        if (err) return res.end(err);
        res.end(JSON.stringify(maps));
    });
});

app.get("/categories", function(req, res, next){
    Category.find(function (err, cats) {
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
    
    var body = '';
    req.on('data', function(chunk) {
        body += chunk;
    });
    req.on('end', function() {
        var data = qs.parse(body);
        res.setHeader('Content-Type', 'application/json');
    
        var map = new Map({name: data.name});
        map.save(function(err, map){
            if(err) ( res.end(JSON.stringify({result:false})));
            res.end(JSON.stringify({result:true, map:map}));
            
        });
    });
    
});

app.post("/create_category", function(req, res, next){
    var body = '';
    req.on('data', function(chunk) {
        body += chunk;
    });
    req.on('end', function() {
        var data = qs.parse(body);
        res.setHeader('Content-Type', 'application/json');
    
        var category = new Category({name: data.name, icon: data.icon});
        category.save(function(err, category){
            if(err) ( res.end(JSON.stringify({result:false})));
            res.end(JSON.stringify({result:true, category:category}));            
        });
    });    
});


app.get('/edit_map/:id', function(req, res) {
    var id = req.params.id;
    Map.findById(id).exec(function(err, map){
        Category.find().populate("markers", null, {_map:id} ).exec(function (err, cats) {
            if (err) return console.error(err);
            console.log(cats);
            res.render('edit_map.ejs', {page: "Map editor", map: map, categories: cats});
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

app.get('/delete_category/:id', function(req, res) {
    var id = req.params.id;
    Category.findById(id).exec(function(err, category){
        category.remove();
        res.end(JSON.stringify({result:true}));    
    });
});

app.post('/edit_map/:id', function(req, res, next){
    var body = '';
    req.on('data', function(chunk) {
        body += chunk;
    });
    req.on('end', function() {
        Map.findById(req.params.id, function(err, map){
            var data = qs.parse(body);
            res.setHeader('Content-Type', 'application/json');
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
});

app.post('/edit_map/:id/add_marker', function(req, res, next){
   var body = '';
    req.on('data', function(chunk) {
        body += chunk;
    });
    req.on('end', function() {
        Map.findById(req.params.id, function(err, map){
            res.setHeader('Content-Type', 'application/json');
    
            if(err) res.end(JSON.stringify({result:false, error:err}));
            
            var data = qs.parse(body);
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
});

app.get('/edit_map/:id/delete_marker/:mid', function(req,res,next){
    Map.findById(req.params.id).populate("markers",null,{ _id: req.params.mid}).exec(function(err,map){
        if(err) res.end(JSON.stringify({result:false,error:err}));
        map.markers[0].remove();
        res.end(JSON.stringify({result:true}));
    });
});

app.listen(port, function(){
    console.log("Web server listening on port "+ port);
});
