//From the DEV Branch
// import dependencies you will use
const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');

// set up expess validator
const {check, validationResult} = require('express-validator'); //destructuring an object
const session = require('express-session');//session

// connect to DB
mongoose.connect('mongodb://localhost:27017/carcares',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// define the model
const Ticket = mongoose.model('Ticket', {
    clientName : String,
    clientEmail : String,
    serviceDescription : String,
    imageName : String
});

// define model for admin users
const User = mongoose.model('User', {
    uName: String,
    uPass: String
});

// set up variables to use packages
var myApp = express();

//session
myApp.use(session({
    secret: 'myrandomsecret',
    resave: false,
    saveUninitialized: true
}));

myApp.use(express.urlencoded({extended:false})); // new way after Express 4.16
myApp.use(fileUpload()); // set up the express file upload middleware to be used with Express

// set path to public folders and view folders
 myApp.set('views', path.join(__dirname, 'views'));

 //use public folder for CSS etc.
myApp.use(express.static(__dirname+'/public'));
myApp.set('view engine', 'ejs');


var nameRegex = /^[a-zA-Z0-9]{1,}\s[a-zA-Z0-9]{1,}$/;

// set up different routes (pages) of the website
// render the home page
myApp.get('/',function(req, res){
res.render('home'); // will render views/home.ejs
});

// render the about page*****
myApp.get('/about',function(req, res){
res.render('about'); // will render views/about.ejs
});

// show login page
myApp.get('/login',function(req, res){
res.render('login'); // will render views/login.ejs
});

//show all tickets in login page********
myApp.post('/login',function(req,res){

//fetch user password exist or not
var uName = req.body.uname;
var uPass = req.body.upass;

//find it ins the database
User.findOne({uName: uName, uPass: uPass}).exec(function(err,user){
//setup session variable for logged in users
    console.log('Errors: ' + err);
    if(user){
        req.session.uName = user.uName;
        req.session.loggedIn = true;
        //redirect to dashboard
        res.redirect('/alltickets');
    }
    else{
        res.redirect('/login'); // OR
        //Alternate:- render login with errors
        //res.render('login',{error: 'Incorrect username/password'});
    }
});

});

// show all cards after login
myApp.get('/alltickets',function(req, res){
    if(req.session.loggedIn){
          //code to fetch all the cards from db and send to the view alltickets
          Ticket.find({}).exec(function(err, tickets){
            console.log(err);
            console.log(tickets);
            res.render('alltickets', {tickets:tickets}); // will render views/alltickets.ejs
    });
    }
    else{
        res.redirect('/login');
    }
});

myApp.get('/logout',function(req, res){
   
    req.session.uName = '';
    req.session.loggedIn = false;
    res.redirect('/login');

});

// showing only one ticket depending on the id
myApp.get('/print/:clientid', function(req, res){
    // Code to fetch a ticket and create pageData
    if(req.session.loggedIn){ 
    var clientId = req.params.clientid;
    Ticket.findOne({_id: clientId}).exec(function(err, ticket){
        console.log(ticket);
        res.render('ticket', ticket); // render thanks.ejs with the data from ticket
    });}
})

//delete some ticket
myApp.get('/delete/:clientid', function(req, res){
    //logic to put this page behind login
     //code to fetch a card and create pageData
     if(req.session.loggedIn){ 
          var clientId = req.params.clientid;
          Ticket.findByIdAndDelete({_id: clientId}).exec(function(err, ticket){
        
             res.render('delete', ticket); // render delete.ejs with the data from ticket
            });}
 })

 //edit some ticket
myApp.get('/edit/:clientid', function(req, res){
    //logic to put this page behind login
     //code to fetch a ticket and create pageData
     if(req.session.loggedIn){ 
        var clientId = req.params.clientid;
       ///logic to show a ticket in a form with the details
       Ticket.findOne({_id: clientId}).exec(function(err, ticket){
        console.log(ticket);
        res.render('edit', ticket);  // render ticket.ejs with the data from ticket
    });}
 })
 // processing from admin(edit page)
myApp.post('/editprocess/:clientid', function(req,res){
    if(!req.session.loggedIn)
    {
      res.redirect('/login');
    }
    else
    {
        //fetch all the form fields
        var clientName = req.body.clientName; // the key here is from the name attribute not the id attribute
        var clientEmail = req.body.clientEmail;
        var serviceDescription = req.body.serviceDescription;

        // fetch the file 
        // get the name of the file
        var imageName = req.files.abimage.name;
        console.log(req.files.abimage);
        // get the actual file
        var imageFile = req.files.abimage; // this is a temporary file in buffer.
 // get the actual file
 var imageFile = req.files.abimage; // this is a temporary file in buffer.
 //const abc;
 // save the file
 // check if the file already exists or employ some logic that each filename is unique.
 var imagePath = 'public/uploads/' + imageName;
 // move the temp file to a permanent location mentioned above
 imageFile.mv(imagePath, function(err){
     console.log(err);
 });

     
      //find the ticket in db and update it
      var clientId = req.params.clientid;
      Ticket.findOne({_id: clientId}).exec(function(err, ticket){
          //update the card and save
          ticket.clientName = clientName;
          ticket.clientEmail = clientEmail;
          ticket.serviceDescription = serviceDescription;
          ticket.imageName = imageName;
          
          ticket.save();
        res.render('thanks_edit', ticket); // render ticket.ejs with the data from card
    });
    } 
    
});


myApp.post('/process',[
    check('serviceDescription', 'Please enter a description.').not().isEmpty(),
    check('clientEmail', 'Please enter a valid email').isEmail(),
    check('clientName', 'Please enter firstname and lastname').matches(nameRegex)
], function(req,res){

    // check for errors
    const errors = validationResult(req);
    console.log(errors);
    if(!errors.isEmpty())
    {
        res.render('home',{er: errors.array()});
    }
    else
    {
        //fetch all the form fields
        var clientName = req.body.clientName; // the key here is from the name attribute not the id attribute
        var clientEmail = req.body.clientEmail;
        var serviceDescription = req.body.serviceDescription;

        // fetch the file 
        // get the name of the file
        var imageName = req.files.abimage.name;
        console.log(req.files.abimage);
        // get the actual file
        var imageFile = req.files.abimage; // this is a temporary file in buffer.

        // save the file
        // check if the file already exists or employ some logic that each filename is unique.
        var imagePath = 'public/uploads/' + imageName;
        // move the temp file to a permanent location mentioned above
        imageFile.mv(imagePath, function(err){
            console.log(err);
        });

        // create an object with the fetched data to send to the view
        var pageData = {
            clientName : clientName,
            clientEmail : clientEmail,
            serviceDescription : serviceDescription,
            imageName : imageName
        }

        // create an object from the model to save to DB
        var myTicket = new Ticket(pageData);
        // save it to DB
        myTicket.save();

        // send the data to the view and render it
        res.render('thanks_client', pageData);
    }
});

// setup routes******
myApp.get('/setup', function(req, res){
    let userData = [
        {
            uName: 'admin',
            uPass: 'admin'
        },
        {
            uName: 'aman',
            uPass: 'bali'
        },
    ]
    User.collection.insertMany(userData);
    res.send('data added');
});


// start the server and listen at a port
myApp.listen(8080);

//tell everything was ok
console.log('everything executed,open http://localhost:8080/ in the browser');


