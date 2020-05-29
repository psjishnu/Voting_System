var http = require("http");
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var url = require("url");
var fs = require("fs");
app.set("view engine", "ejs");
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var mysql = require("mysql");
app.use(express.static(__dirname + "/public"));
const SHA256 = require("crypto-js/sha256");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
var adname = "admin";
var adpass = "admin"; // Credentials for entering admin page
var loggedinname = "",
  arr = [];
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "jishnu",
  //Create a table voters in jishnu with varchar name and varchar address
});
function Dategen() {
  let date_ob = new Date();
  let date = ("0" + date_ob.getDate()).slice(-2);
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  let year = date_ob.getFullYear();
  let hours = date_ob.getHours();
  let minutes = date_ob.getMinutes();
  let seconds = date_ob.getSeconds();
  var dte = "";
  dte =
    year +
    "-" +
    month +
    "-" +
    date +
    " " +
    hours +
    ":" +
    minutes +
    ":" +
    seconds;
  return dte;
}
class Block {
  init;
  constructor(index, timestamp, data, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }
  calculateHash() {
    return SHA256(
      this.index +
        this.previousHash +
        this.timestamp +
        JSON.stringify(this.data)
    ).toString();
  }
}
class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }
  createGenesisBlock() {
    return new Block(0, "01/01/2017", "Genesis Block", "0");
  }
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }
  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
  }
}
let jis = new Blockchain();
con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});
con.query('show tables like "voters"', function (err, result, fields) {
  if (result.length == 0) {
    con.query("create table voters(name varchar(100) , password varchar(100))");
  }
});
con.query('show tables like "vote"', function (err, result, fields) {
  if (result.length == 0) {
    con.query("create table vote(name varchar(100) , vote int)");
  }
});

var server = app.listen(8000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Voting System is listening at localhost:", port);
});

app.get("/ensure", function (req, res) {
  var k = JSON.stringify(jis, null, 4);
  var obj = JSON.parse(k);
  var i, j;
  var len1 = obj.chain.length;
  function fun1(x, y, z) {
    ins(x, y, z);
  }
  con.query("SELECT name,v FROM vote", function (err, result, fields) {
    var safe = 1,
      restart = 1,
      datapresent = 1;
    if (obj.chain.length < 2 && result.length < 1) datapresent = 0;
    for (i = 0; i < result.length; i++) {
      for (j = 0; j < len1 - 1; j++) {
        if (obj.chain[j + 1].data == result[i].name) {
          restart = 0;
          if (obj.chain[j + 1].index != result[i].v) {
            safe = 0;
            break;
          }
        }
      }
      if (safe == 0) break;
    }
    fun1(safe, restart, datapresent);
  });
  function ins(q1, q2, q3) {
    if (q3 == 0) {
      res.render("login", { response: "NO VOTES POLLED", logg: "" });
    } else if (q1 == 1 && q2 == 0) {
      res.render("login", { response: "THE DATA IS INTACT", logg: "" });
    } else if (q2 == 1) {
      res.render("login", { response: "ERROR (RESTART)", logg: "" });
    } else {
      res.render("login", { response: "DATA TAMPERED!", logg: "" });
    }
  }
});
app.get("/", function (req, res) {
  res.render("login", { response: "", logg: "" });
});
app.get("/register", urlencodedParser, function (req, res) {
  res.render("register", { regresult: "" });
});
app.post("/thank1", urlencodedParser, function (req, res) {
  var nn = "";
  var np = "";
  var npre = "";
  var ns = "";
  var lock = 0;
  var sql = "INSERT INTO voters (name, password) VALUES ('x1', 'x2')";
  nn = req.body.name;
  np = req.body.password;
  ns = req.body.submit;
  npre = req.body.repassword;
  function verify(x) {
    var x1 = 0;
    x1 = x;
    if (np != npre) {
      x1 = 3;
    }
    ins(x1);
  }
  con.query("SELECT name,password FROM voters", function (err, result, fields) {
    for (i = 0; i < result.length; i++) {
      if (result[i].name == nn) {
        lock = 1;
        break;
      }
    }
    verify(lock);
  });
  function ins(ax) {
    if (ax == 0) {
      var sql1 = sql.replace("x1", req.body.name);
      sql1 = sql1.replace("x2", req.body.password);
      con.query(sql1, function (err, result) {
        if (err) throw err;
        console.log("record inserted");
      });
      res.render("register", { regresult: "NEW USER REGISTERED" });
    } else if (ax == 3) {
      res.render("register", { regresult: "PASSWORD NOT SAME" });
    } else {
      res.render("register", { regresult: "USERNAME ALREADY EXISTS" });
    }
  }
});
app.post("/vote", urlencodedParser, function (req, res) {
  var nn = "";
  nn = req.body.name;
  var inn = 0;
  var sql = "INSERT INTO vote (name, vote) VALUES ('x1', x2)";
  sql = sql.replace("x1", loggedinname);
  sql = sql.replace("x2", nn);
  function verify(x) {
    ins(x);
  }
  con.query("SELECT name,vote FROM vote", function (err, result, fields) {
    var lock = 0;
    for (i = 0; i < result.length; i++) {
      if (loggedinname == result[i].name) {
        lock = 1;
        break;
      }
    }
    verify(lock);
  });
  function ins(ax) {
    if (ax == 0) {
      var p = Dategen();
      con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("vote inserted");
      });
      jis.addBlock(new Block(nn, p, loggedinname));
      res.render("vote", {
        welname: loggedinname,
        welcomeins: "VOTED SUCCESSFULLY",
      });
    } else {
      res.render("vote", {
        welname: loggedinname,
        welcomeins: "ALREADY VOTED",
      });
    }
  }
});

app.post("/thank", urlencodedParser, function (req, res) {
  res.header(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  var nn = "";
  var np = "";
  var ns = "";
  var sql = "INSERT INTO voters (name, password) VALUES ('x1', 'x2')";
  nn = req.body.name;
  np = req.body.password;
  ns = req.body.submit;

  if (nn == adname && np == adpass) {
    var len1,
      str2 = "",
      i = 0,
      c1 = 0,
      c2 = 0,
      c3 = 0,
      c4 = 0,
      str3 = "";
    var k = JSON.stringify(jis, null, 4);
    var obj = JSON.parse(k);
    len1 = obj.chain.length;

    if (len1 < 2) {
      res.render("admin", { adminmsg: "NO DATA", contacts1: "", contacts: "" });
    } else {
      for (i = 1; i < len1; i++) {
        if (obj.chain[i].index == 1) c1++;
        else if (obj.chain[i].index == 2) c2++;
        else if (obj.chain[i].index == 3) c3++;
        else if (obj.chain[i].index == 4) c4++;
      }
      arr = ["id1", c1, "id2", c2, "id3", c3, "id4", c4];
      res.render("admin", {
        adminmsg: "",
        contacts1: arr,
        contacts: obj.chain,
      });
    }
  } else {
    con.query("SELECT name,password FROM voters", function (
      err,
      result,
      fields
    ) {
      if (err) throw err;
      var inn = 0;
      for (i = 0; i < result.length; i++) {
        if (nn == result[i].name && np == result[i].password) {
          inn = 1;
          break;
        }
      }
      if (inn == 1) {
        loggedinname = nn;
        res.render("vote", { welname: nn, welcomeins: "" });
      }
      if (inn == 0) {
        res.render("login", { response: "", logg: "INVALID CREDENTIALS" });
      }
    });
  }
});

app.get("/rollback", urlencodedParser, function (req, res) {
  var len1,
    str2 = "",
    i = 0,
    j = 0,
    sql = "";
  var k = JSON.stringify(jis, null, 4);
  var obj = JSON.parse(k);
  len1 = obj.chain.length;
  if (len1 > 1) {
    con.query("SELECT name,v FROM vote", function (err, result, fields) {
      for (i = 1; i < len1; i++) {
        for (j = 0; j < result.length; j++) {
          if (result[j].name == obj.chain[i].data) {
            sql = 'update vote set v=x1 where name="x2"';
            sql = sql.replace("x1", obj.chain[i].index);
            sql = sql.replace("x2", result[j].name);
            con.query(sql, function (err, result, fields) {});
          }
        }
      }
    });
    res.render("admin", {
      adminmsg: "CORRECTED",
      contacts1: arr,
      contacts: obj.chain,
    });
  } else {
    res.render("admin", {
      adminmsg: "DATABASE EMPTY",
      contacts1: arr,
      contacts: obj.chain,
    });
  }
});
app.get("/clear", urlencodedParser, function (req, res) {
  jis = new Blockchain();
  con.query("delete from vote", function (err, result, fields) {});
  res.render("login", { response: "DATA CLEARED", logg: "" });
});
