const http = require('http');
const fs = require('fs');

const STARTAPIINFONAME = "apiName: string = ";
const STARTAPIINFO = "apiInfo: ApiInfo = ";
const ENDAPIINFO = "export default apiInfo;";
const STARTREFBOOKINFONAME = "refbookName: string = ";
const STARTREFBOOKINFO = "refbookInfo: RefbookInfo = ";
const ENDREFBOOKINFO = "export default refbookInfo;";
let settings;
let projectAddress;
const allInfo = {};

function requestListener(req, res) {
    switch (req.url) {
        case '/aapig/init':
            res.setHeader("Content-Type", "application/json");
            res.setHeader('Access-Control-Allow-Origin',projectAddress);
            res.setHeader('Access-Control-Allow-Headers',"access-control-request-methods,authorization,content-type");
            res.setHeader('Access-Control-Allow-Methods',"GET");
            res.writeHead(200);
            res.end(JSON.stringify(allInfo))
            break;
        case '/aapig/writeFile':
            res.setHeader("Content-Type", "application/json");
            res.setHeader('Access-Control-Allow-Origin',projectAddress);
            res.setHeader('Access-Control-Allow-Headers',"access-control-request-methods,authorization,content-type");
            res.setHeader('Access-Control-Allow-Methods',"POST, GET, OPTIONS");
            res.writeHead(200);
            res.end(JSON.stringify({message: 'ok'})); break;
        default: res.writeHead(404); res.end(JSON.stringify({message: 'Не существующий адрес'}))
    }
}
function getInfo(infoPath, name, info) {
    return new Promise((resolve,reject) => {
        fs.readdir(infoPath,(error, files) => {
            if (error) {
                reject(error);
            } else {
                let count = files?.length;
                let allInfo = {};
                if (count) {
                    for (let apiInfoFileName of files) {
                        fs.readFile(infoPath + '/' + apiInfoFileName,(error, data) => {
                            if (error) {
                                reject(error)
                            } else {
                                let fileStr = data.toString();
                                let nameStart = fileStr.indexOf(name.start) + name.start.length + 1;
                                let nameEnd = fileStr.indexOf("'", nameStart);
                                if (nameEnd === -1) nameEnd = fileStr.indexOf('"', nameStart);
                                let infoStart = fileStr.indexOf(info.start) + info.start.length;
                                let infoEnd = fileStr.indexOf(info.end, infoStart)
                                let infoName = fileStr.slice(nameStart,nameEnd);
                                allInfo[infoName] = JSON.parse(fileStr.slice(infoStart,infoEnd));
                                if (Object.keys(allInfo)?.length === count) {
                                    resolve(allInfo);
                                }
                            }
                        })
                    }
                }
            }
        })
    })
}
function getApiInfo() {
    return getInfo('apig/apiInfo',
        {start: STARTAPIINFONAME}, 
        {start: STARTAPIINFO, end: ENDAPIINFO});
}
function getRefbookInfo() {
    return getInfo('aapig/refbookInfo',
        {start: STARTREFBOOKINFONAME},
        {start: STARTREFBOOKINFO, end: ENDREFBOOKINFO});
}
fs.readFile('src/server/settings.json', (error, data) => {
    if (error) {
        console.error(error);
    } else {
        settings = JSON.parse(data.toString());
        if (settings?.server) {
            const host = settings.server?.host;
            const port = Number(settings.server?.port);
            console.log('host:', host, '\nport:', port);
            if (host && typeof host === 'string' && port && typeof port === 'number') {
                // projectAddress = "http://" + settings.project.host + ":" + settings.project.port;
                projectAddress = " http://localhost:5490";
                getApiInfo().then((apiInfo) => {
                    allInfo.api = apiInfo;
                    getRefbookInfo().then((refbookInfo) => {
                        allInfo.refbook = refbookInfo;
                        const server = http.createServer(requestListener);
                        server.listen(port, host, () => {
                            console.log(`Сервер работы с файлами запущен по адресу http://${host}:${port}/aapig`);
                        });
                    })
                })
            } else {
                console.error('Настройки порта и/или хоста сервера заданы некорректно!')
            }
        } else {
            console.error('Не обнаружены настройки сервера!')
        }
    }
})





