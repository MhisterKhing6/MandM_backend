/*Handles file operation for admin*/
import config from "config";
import { mkdir, readFile, writeFile, rm } from "fs";
import path, { basename } from "path";
import { v4 } from "uuid";
import { promisify } from "util";
const readFileAsync = promisify(readFile);
const writeFileAsyc = promisify(writeFile);
const rmAsync = promisify(rm);
const mkdirAsync = promisify(mkdir);

const createFilePath = async (picName, userId, type) => {
  /**
   * createDirectory: create a directory for a file
   * @param {string}:use to uniquly manage files folder structure
   * @returns {int}: positive or negatvie depending on successfull folder creation
   */
  //get absolute path of current directory calling the function
  let abs = path.resolve(".");
  //find type
  let baseFolder = "";
  if (type === "vId") baseFolder = "vendors-identity";
  else if (type === "item") baseFolder = "store-items";
  //join paths to get parent directory of files
  let relativePath = path.join("public", baseFolder, userId);
  let fullPath = path.join(abs, relativePath);
  //create folder on a disk
  try {
    let response = await mkdirAsync(fullPath, { recursive: true });
    //join created folder with fileName to create folder parent path
    let fileName = `${v4()}${path.extname(picName)}`;
    let filePath = path.join(fullPath, fileName);
    let ulrPath = path.join(relativePath, fileName);
    return { filePath, urlPath: ulrPath };
  } catch (err) {
    console.log(err);
    return null;
  }
};

const decodeBase64 = async (bas64String) => {
  /**
   * decodeBase64: decode base64 string to a buffer
   * base64String: a base 64 string to decode into a buffer
   */
  let buffer = Buffer.from(bas64String, "base64");
  return buffer;
};

const getFileNameFromTitle = (title, fileName) => {
  let extension = fileName.split(".").pop();
  //get extension from user filename given
  let extName = path.extname(fileName);
  if (!extName) return null;
  //replace space in title with dash
  let dashedtitle = title.replace(/\s+/g, "-");
  return dashedtitle + extName;
};

const generateFileUrl = (filePath) => {
  let appHost = config.get("host");
  let host = process.env.HOST || appHost.ip;
  let port = process.env.PORT || appHost.port;
  let baseUrl = appHost.onePath || `${appHost.protocol}://${host}:${port}`;
  return `/${filePath}`;
};

const saveUploadFileDisk = async (fileName, base64Data, userId, type) => {
  /**
   * writeFile : saves buffer data to file
   * @param {string} fileName: file name of the file
   * @param {string} adminId: the id of the admiin uplaading the file, use for folder structure
   * @param {string} base64Data: base64 data to save
   * @returns {{status: 'int" , filePath:"str"}} status 0 if file exist, 1 if success with file path and -1 if error occured
   */
  //create file path
  try {
    let picPath = await createFilePath(fileName, userId, type);
    if (!picPath) return null;
    //check if file with the same file name exist
    let buffer = await decodeBase64(base64Data);
    //write file to disk
    await writeFileAsyc(picPath.filePath, buffer);
    return picPath;
  } catch (err) {
    console.log(err);
    return null;
  }
};

const deleteFolder = async (path) => {
  await rmAsync(path, { recursive: true, force: true });
};

export {
  deleteFolder,
  createFilePath,
  generateFileUrl,
  getFileNameFromTitle,
  saveUploadFileDisk,
};
