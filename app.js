const Koa = require('koa');
const path = require('path');
const koaBody = require('koa-body');
const static = require('koa-static');

const home = require('./routes/home.js')

const app = new Koa();
app.use(async (ctx, next) => {
  fileFilter(ctx)
  await next()
})
app.use(koaBody({ //ctx.request.body 用于获取post的参数;//ctx.query 是用于获取get请求的参数;ctx.request.files获取文件
  multipart: true, // 支持文件上传
  formidable: {
    maxFileSize: 2 * 1024 * 1024 * 1024, // 单次上传的文件最大为2G
    multipart: true 
  }
}));

app.use(static(path.join(__dirname,'./static')));

app.use(home.routes(), home.allowedMethods())

app.on("error",(err,ctx)=>{//捕获异常记录错误日志
  console.log(new Date(),":",err);
});

app.listen(9000, () => {
  console.log('server is listen in 9000');
});

function fileFilter(ctx){
  const url = ctx.request.url
  const p = /^\/files\//
  if(p.test(url)){
    ctx.set('Accept-Ranges', 'bytes')
    ctx.set('Content-Disposition', 'attachment')
  }
}

