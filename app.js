var express = require("express");
const fs=require('fs');
const bcrypt = require('bcryptjs');
var app = express();
var bodyParser = require("body-parser");
var sql = require("mysql");
const multer = require('multer');
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: 'ASIAUYMHXQLY44WTISGY',
    secretAccessKey: 'yrUop3vzVNzWowMBvaiBPMn7fNNSMlViMTG0U6Zr',
    sessionToken: 'FwoGZXIvYXdzEOP//////////wEaDKTseutHM73PL/afHCLWAdlhakCn9H2RpYytUTXC/KDQ223zF278OADJtjYHwUF5wvjfgI3DWau5HSgdZUw4gsNKUpPV6ACs53XRqpdqPzW1yxlqskb1rQRMM+XJYovgaFNWsr/d6uhKRkEIzc++LtZRgnwfFhyAyzwRP2hdzu8RI82pACFDsNI4nSGS8H5/NNFXqw6hdxdYit154B+Iomrr8QbRVPBEcznwmCfUABD9P+ZO//iorzu51qrvsugfnp9sKaByLuPCw3d/FRPTOnAXKjm3KcR5J54haVH6hRUOc04eB8EovrXV/QUyLYWl7nIm/+uTZzfrxYdhVt2aJz12qc5dpebibDPjp+9ytDFBsBXdIde1oo7ZNw==',
    region: 'us-east-1'
});
var s3bucket = new AWS.S3();

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/images');
        },
        filename: (req, file, cb) => {
            const name = (file.originalname);
            cb(null, name);
        }
    })
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static("uploads"));
app.set("view engine", "ejs");

var sqlConnection = sql.createConnection({
    host: "database-1.cdo8vrj1hsse.us-east-1.rds.amazonaws.com",
    user: "admin",
    port: "3306",
    password: "SupermaN5401",
    database: "doubtclarifier",
    multipleStatements: true
});
sqlConnection.connect(function (err) {
    if (!err) {
        console.log("Connected to SQL");
    } else {
        console.log("Connection Failed" + err);
    }
});

app.get("/", function (req, res) {
    res.render("home.ejs");
});

var msg = "fine";
var msgr = "fine";
app.get("/login", function (req, res) {
    res.render("login.ejs", { msg: msg, msgr: msgr });

});

app.get("/profile_home/:id", function (req, res) {
    res.render("profile_home.ejs",{id:req.params.id});

});

app.get("/question", function (req, res) {
    res.render("question.ejs");

});

app.get("/answer", async function (req, res) {
    
    await sqlConnection.query(`Select * from doubts_table`, function (err, results) {
        if (err) {
            console.log(err);
            res.redirect("back");    
        }
        else{
            res.render("answer.ejs",{queries:results});

        }
    })

});


app.post("/login", async function (req, res) {
    msg = "fine";
    msgr = "fine";
    var dummy = ["Hello", "How are You"];
    await sqlConnection.query(`Select * from user_table where EmailID='${req.body.email}' and Password='${req.body.password}'`, function (err, results) {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else if (results.length === 0) {
            msg = "Username/Password incorrect"
            res.redirect("/login");
        }

        else {
            console.log(results);
            res.redirect("/profile_home/" + results[0].EmailID);
        }

    });


});

app.post("/register", async function (req, res) {
    msgr = "fine";
    msg = "fine";
    await sqlConnection.query(`insert into user_table set ?`, { EmailID: req.body.email, Password: req.body.password }, function (err, results) {
        if (err) {
            console.log(err);
            msgr = "Registration Failed";
            res.redirect("/login");

        }
        else {
            msgr="Registration Successful"
            console.log(results);
            res.redirect("/login");
        }
    })
})

app.post("/question", upload.single("diagram"), async function (req, res) {
    if (req.file) {

        console.log(req.file);
        console.log(req.file.filename);
        console.log(req.file.destination);
        var image = "https://manojedutech.s3.amazonaws.com/" + req.file.filename+'_'+req.body.email;
        console.log(image);

        var params = {
            Bucket: 'manojedutech',
            Key: `${req.file.filename}_${req.body.email}`,
            Body: fs.createReadStream(req.file.path),
            ACL: 'public-read'
        };
        await s3bucket.putObject(params, function(err, data) {
            if (err) {
                console.log(err);
                return console.log("Error storing picture");
            } else {
                return console.log("Successfully stored Question Image!");
            }
        });
}
else var image = null;
    await sqlConnection.query(`insert into doubts_table set ?`, { asked_by: req.body.email, question: req.body.question, subject: req.body.subject, status: 0, question_image: image },
        function (err, results) {
            if (err) {
                console.log(err);
                res.redirect("/question");
            }
            else {
                console.log(results);
                res.redirect("/profile_home/" + req.body.email);
            }
        })
})

app.post("/answer/:id", upload.single("diagram"), async function (req,res){
    if (req.file) {

        console.log(req.file);
        console.log(req.file.filename);
        console.log(req.file.destination);
        var image = "https://manojedutech.s3.amazonaws.com/" + req.file.filename+'_'+req.body.email;
        console.log(image);

        var params = {
            Bucket: 'manojedutech',
            Key: `${req.file.filename}_${req.body.email}`,
            Body: fs.createReadStream(req.file.path),
            ACL: 'public-read'
        };
        await s3bucket.putObject(params, function(err, data) {
            if (err) {
                console.log(err);
                return console.log("Error storing picture");
            } else {
                return console.log("Successfully stored Answer image");
            }
        });
}else var image = null;
    await sqlConnection.query(`update doubts_table set ? where doubt_id='${req.params.id}'`,{answer:req.body.answer,answered_by:req.body.email,status:1,answer_image:image},
    function(err,results){
        if(err){
            console.log(err)
            res.redirect("back");
        }
        else{
            console.log(results);
                res.redirect("/profile_home/" + req.body.email);

        }
    })
})

// app.get("/home/:id", function(req, res) {
//     console.log(req.params.id);
//     sqlConnection(`Select * from user where username='${req.params.id}'`)
// })
app.listen(3000, function () {
    console.log("cONNECTED TO Host");
});