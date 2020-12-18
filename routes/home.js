const router = require('koa-router')()
const fs = require('fs');
const path = require('path');
const resolveFilePath = name => path.join(__dirname, `../static/files`,name)
const resolveFilePathTemp = name => path.join(__dirname, `../static/files/temp`,name)

router.get('/getFileList', (ctx) => {
    var files = []
    walkSync('static/files', function(name,filePath, stat) {
        const fileUrl = filePath.replace(/static/,'').replace(/\\/g,'/')
        files.push({
            url : fileUrl,
            size: stat.size,
            name: name
        })
    });
    ctx.body = {
        code: 400001,
        files: files
    }
});

// router.get('/downloadFile', (ctx) => { 
//     var picUrl = ctx.query.picUrl
//     var relative = path.relative('http://localhost:9000', picUrl)
//     var filepath = path.join(__dirname, `../${relative}`)
//     var stat = fs.statSync(filepath);
//     ctx.set('Content-Type', 'application/octet-stream')
//     ctx.set('Content-Length', stat.size)
//     ctx.body = fs.createReadStream(filepath);
// });

router.post('/uploadFile', (ctx) => { 
    if(!ctx.request.files){
        ctx.body = {
            code: 400003,
            message: '请选择文件'
        }
    }else{
        var files = ctx.request.files['upload-file']
        if(Array.isArray(files)){
            files.forEach(function(file){
                saveFile(file)
            })
        }else{
            saveFile(files)
        }
        ctx.body = {
            code: 400001,
            message: '上传成功'
        }
    }
});

router.post('/uploadBigFile', async (ctx) => { 
    var { index, hash } = ctx.request.body
    var file = ctx.request.files.data
    await saveFragmentFile(file,hash,index)
    ctx.body = {
        code: 400001,
        message: '上传成功'
    }
});

router.post('/mergeFile', async (ctx) => { 
    var { hash,name } = ctx.request.body
    var files = fs.readdirSync(resolveFilePathTemp(hash)).sort(function(a,b){return a-b})
    var dirs = files.map((item) => {
        return resolveFilePathTemp(`${hash}/${item}`)
    })
    await mergeFile(dirs, resolveFilePath(name))
    deleteDir(resolveFilePathTemp(hash))
    ctx.body = {
        code: 400001,
        message: '上传成功'
    }
});

router.post('/checkFile', async (ctx) => { 
    var { name } = ctx.request.body //以hash命名
    var chunks = []
    var files = fs.readdirSync(resolveFilePathTemp(''))
    files.forEach( file => {
        if(file == name){
            var filePath = resolveFilePathTemp(file);
            var stat = fs.statSync(filePath);
            if(stat.isDirectory()){
                chunks = fs.readdirSync(resolveFilePathTemp(file))
            }
        }
    })
    ctx.body = {
        code: 400001,
        data: {
            chunks: chunks
        }
    }
});

//遍历文件目录，返回文件列表
function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(name,filePath, stat);
        } 
    });
}
//处理上传文件
function saveFile(file){
    var writeFilePath = resolveFilePath(file.name)
    readStream = fs.createReadStream(file.path);
    writeStream = fs.createWriteStream(writeFilePath);
    readStream.pipe(writeStream);
};
//处理分片上传文件
async function saveFragmentFile(file,hash,index){
    return new Promise((resolve,reject) =>{
        var exist = fs.existsSync(resolveFilePathTemp(hash))
        if(!exist){
            fs.mkdirSync(resolveFilePathTemp(hash))
        }
        var writeFilePath = resolveFilePathTemp(`${hash}/${index}`)
        readStream = fs.createReadStream(file.path);
        writeStream = fs.createWriteStream(writeFilePath);
        readStream.pipe(writeStream);
        readStream.on("end",() => {
            resolve()
        })
        readStream.on("error",() => {
            reject()
        })
    })
};
//合并文件
function mergeFileRecursive(dirs, fileWriteStream,resolve){
    if (!dirs.length) {
        fileWriteStream.end("console.log('Stream 合并完成')")
        resolve()
        return 
    }
    const currentFile = dirs.shift()
    const currentReadStream = fs.createReadStream(currentFile)

    currentReadStream.pipe(fileWriteStream, { end: false });
    currentReadStream.on('end', function() {
        mergeFileRecursive(dirs, fileWriteStream,resolve);
    });
}
async function mergeFile(dirs, writePath){
    const fileWriteStream = fs.createWriteStream(writePath);
    return new Promise((resolve) => {
        mergeFileRecursive(dirs, fileWriteStream,resolve)
    })
}

function deleteDir(url) {
    var files = [];
    if (fs.existsSync(url)) {
        files = fs.readdirSync(url);
        files.forEach(function (file, index) {
            var curPath = path.join(url, file);
            fs.unlinkSync(curPath);
        });
        fs.rmdirSync(url);
    } else {
        console.log("给定的路径不存在，请给出正确的路径");
    }
}


module.exports = router