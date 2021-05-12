const express = require("express");
const app = express();
const dblib = require("./dblib.js");
const path = require("path");
const multer = require("multer");
const upload = multer();
const { Pool } = require("pg");
const e = require("express");
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});

app.use(express.static("public"));

app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
    res.render("index");
});


//get import
app.get("/import", async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    const book = {
        book_id: "",
        title: "",
        total_pages: "",
        rating: "",
        isbn: "",
        published_date: ""
    };
    res.render("import", {
        type: "get",
        totRecs: totRecs.totRecords,
        book: book
    });
});
// post import
app.post("/import", upload.single('filename'), async (req, res) => {
    const totRecs = await dblib.getTotalRecords();
    if (!req.file || Object.keys(req.file).length === 0) {
        message = "Error: Import file not uploaded";
        return res.send(message);
    };
    const buffer = req.file.buffer;
    const lines = buffer.toString().split(/\r?\n/);
    const model = req.body;
    var successCount = 0;
    var failCount = 0;
    var errorList = [];
    var recCount = lines.length;
    lines.forEach(line => {
        line = line.replace(/Null/g,"null");
        book = line.split(",");
        var bookId=book[0];
        const sql = "INSERT INTO BOOK(book_id, title, total_pages, rating, isbn, published_date ) VALUES ($1, $2, $3, $4, $5, $6)";
        pool.query(sql, book, (err, result) => {
            if (err) {
                console.log(`Insert Error.  Error message: ${err.message}`);
                failCount++;
                var text = "Book ID: "+ bookId+ " - "+ err.message;
                errorList.push(text);
            } else {
                console.log(`Inserted successfully`);
                successCount++;
            }
            if(recCount == (failCount+successCount)){
                message = `Processing Complete - Processed ${recCount} records`;
                res.render("import", {
                    model: model,
                    success: successCount,
                    failed: failCount,
                    totRecs: totRecs.totRecords,
                    errors: errorList,
                    resRec: (parseInt(totRecs.totRecords)+parseInt(successCount)),
                    type: "POST"
                });
            }
        });
    });
});

//get sum

app.get("/sum", (req, res) => {
    res.render("sum",{
        type:"get"
    });
});
// post sum
app.post("/sum", (req, res) => {
    var startNum=parseInt(req.body.startNum);
    var endNum = parseInt(req.body.endNum);
    var incNum = parseInt(req.body.incNum);
    var sum=0;
    if(endNum < startNum){
        console.log("in if");
        res.render("sum", {
            type: "post",
            err: "1" 
        });
    }else{
        for(var i=startNum;;i=i+incNum){
            if(i<=endNum){
                sum=sum+i;
            }else{
                res.render("sum", {
                    type: "post",
                    err: "0",
                    sum: sum,
                    start: startNum,
                    end: endNum,
                    inc: incNum
                });
            }
            
        }
    }
});
