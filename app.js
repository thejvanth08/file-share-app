require("dotenv").config();
const express = require("express");
// to handle multipart form inputs (files)
const multer = require("multer");

// destination of files to be stored in the server (path: directory of uploaded files)
const upload = multer({ dest: "uploads" });

// to connect to db
const connectDB = require("./db/connect");
const File = require("./models/File");

const bcrypt = require("bcrypt");

const app = express();

app.set("view engine", "ejs");
// to parse form data
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index", { fileLink: undefined}); // index must be within quotes
});

// adding the multer middleware to handle the file input -> to store in the server
// single() -> to handle single file
// "file" -> name we given to the file input in html
app.post("/upload-file", upload.single("file"), async (req, res) => {
  // multer makes the file available within req object, so it contains other properties also
  // path -> path of directory where files are uploaded
  // originalname -> name of the uploaded file
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
  }

  if(req.body.password != null && req.body.password !== "") {
    // hashing the password with salting value (returns promise)
    fileData.password = await bcrypt.hash(req.body.password, 10);
  }

  const fileDoc = await File.create(fileData);
  console.log(fileDoc);

  const fileLink =
    req.protocol +
    "://" +
    req.get("host") +
    "/file/" +
    fileDoc.id;

    res.render("index", { fileLink: fileLink });
});

// for download without password protection (unprotected files)
app.get("/file/:id", handleDownload);
// for download the file with password protection
app.post("/file/:id", handleDownload);

// better way: app.route("/file/:id").get(handleDownload).post(handleDownload);

async function handleDownload(req, res) {
  try {
    // getting the information about the file from DB
    const file = await File.findById(req.params.id);

    // if the file has password
    if (file.password != null) {
      // if the user not entered the password
      if (req.body.password == null) {
        res.render("password", { isIncorrect: undefined });
        return; // to end the response; avoid executing below code
      }

      // password is entered & checking with actual password
      // if it is incorrect password
      if (!(await bcrypt.compare(req.body.password, file.password))) {
        res.render("password", { isIncorrect: true });
        return;
      }
    }

    // updating the downloads count
    file.downloadCount += 1;
    await file.save();
    console.log(file.downloadCount);
    // 1st arg -> path of the file which is downloadable to the client
    // 2nd arg -> default name for that file
    res.download(file.path, file.originalName);
  } catch (err) {
    console.log(err);
  }
}

const start = async () => {
  // connect to server, only after connecting to db
  // in local connection string, it must have actual IP address: 127.0.0.1 (not the localhost)
  await connectDB(process.env.DB_URL);
  
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`server is running at port ${port}`);
  })
}

start();
