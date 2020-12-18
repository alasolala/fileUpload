function Ajax(method,URL,data) {
    return baseAjax(method,URL,null,data,null)
}

function downloadAjax(method,URL,downloadOption){
    return baseAjax(method,URL,downloadOption,downloadOption.data,null)
}

function uploadAjax(method,URL,data,uploadOption){
    return baseAjax(method,URL,null,data,uploadOption)
}

function baseAjax(method,URL,downloadOption, data, uploadOption){
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest()
        xhr.onreadystatechange = function () {
            if(xhr.readyState == 4 && xhr.status == 200){
                if(downloadOption){
                    //xhr.response为二进制流
                    var blob = new Blob([xhr.response],{type:downloadOption.fileType});
                    var href = window.URL.createObjectURL(blob);
                    var link = document.createElement('a');
                    link.href = href;
                    link.download = downloadOption.fileName;
                    link.click();
                    // resolve();
                    if(downloadOption.successCallback){
                        downloadOption.successCallback()
                    }
                }else{
                    resolve(xhr.response)
                }
            }
        }
        //下载文件进度
        if(downloadOption){
            xhr.onprogress = function (ev) {
                if (ev.lengthComputable && downloadOption.progressCallback) {
                    downloadOption.progressCallback(ev.loaded,ev.total)
                }
            }
            xhr.onerror = function(ev){
                console.log(ev)
            }
        }
        //上传文件进度
        if(uploadOption){
            xhr.upload.onprogress = function (ev) {
                uploadOption.progressCallback && uploadOption.progressCallback(ev.loaded,ev.total)
            }
        }
        if(method == 'GET'){
            if(data){
                URL += '?'
                for(var k in data){
                    URL += `${k}=${data[k]}&`
                }
                URL = URL.slice(0,-1)
            }
            data = null
        }
        xhr.open(method, URL, true)
        if(method == 'POST'){
            if(!(data instanceof FormData)){//如果是formdata，浏览器会自动设置content-type
                xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");
            }
        }
        // xhr.timeout = 60000 
        if(downloadOption){
            xhr.responseType = "blob"
        }else{
            xhr.responseType = "json" 
        }
        
        data =  !data || data instanceof FormData ? data : JSON.stringify(data)
        xhr.send(data);
    })
}

function $(selector){
    return document.querySelector(selector)
}


