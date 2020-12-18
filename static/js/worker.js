importScripts("./spark-md5.min.js")
var fileReader = new FileReader(),
    chunkList,chunks,currentChunk,spark

function loadNext() {
    fileReader.readAsArrayBuffer(chunkList[currentChunk].file);
}
fileReader.onload = function(e){
    console.log('load')
    spark.append(e.target.result)
    currentChunk++
    if (currentChunk < chunks) {
        loadNext()
    }else {
        var md5 = spark.end()
        self.postMessage(md5)
    }
}
fileReader.onerror = function (err) {
    console.warn('oops, something went wrong.')
    self.postMessage(null);
}
fileReader.onabort = function (err) {
    console.log('abort')
}
self.addEventListener('message', function (e) {
    if(e.data.changeChunk){
        fileReader.abort()
    }
    chunkList = e.data.chunkList
    chunks = chunkList.length,
    currentChunk = 0,
    spark = new SparkMD5.ArrayBuffer()
    loadNext()

}, false);