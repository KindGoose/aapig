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

const libRoot = '../../';
// const devRoot = 'src/test/';
const root = libRoot;

function requestListener(req, res) {
    switch (req.url) {
        case '/aapig/init':
            res.setHeader("Content-Type", "application/json");
            res.setHeader('Access-Control-Allow-Origin', projectAddress);
            res.setHeader('Access-Control-Allow-Headers', "access-control-request-methods,authorization,content-type");
            res.setHeader('Access-Control-Allow-Methods', "GET");
            res.writeHead(200);
            res.end(JSON.stringify(allInfo))
            break;
        case '/aapig/writeFile':
            res.setHeader("Content-Type", "application/json");
            res.setHeader('Access-Control-Allow-Origin', projectAddress);
            res.setHeader('Access-Control-Allow-Headers', "access-control-request-methods,authorization,content-type");
            res.setHeader('Access-Control-Allow-Methods', "POST, GET, OPTIONS");
            res.writeHead(200);
            req.on('data', (data) => {
                let dataObj = JSON.parse(data.toString());
                writeFile(dataObj.file, dataObj.path);
            })
            res.end(JSON.stringify({message: 'ok'}));
            break;
        default:
            res.writeHead(404);
            res.end(JSON.stringify({message: 'Не существующий адрес'}))
    }
}

function writeFile(fileString, path) {
    fs.writeFile(root + path, fileString, (error) => {
        if (error) {
            console.warn(error.message);
            if (!fs.existsSync(root + path)) {
                let newPath = root + path.slice(0,path.lastIndexOf('/'));
                fs.mkdirSync(newPath, {recursive: true});
                fs.writeFile(root + path, fileString, (error) => {
                    if (error) console.error(error.message);
                })
            }
        }
    })
}

function getInfo(infoPath, name, info) {
    return new Promise((resolve, reject) => {
        fs.readdir(infoPath, (error, files) => {
            if (error) {
                reject(error);
            } else {
                let count = files?.length;
                let allInfo = {};
                if (count) {
                    for (let apiInfoFileName of files) {
                        fs.readFile(infoPath + '/' + apiInfoFileName, (error, data) => {
                            if (error) {
                                reject(error)
                            } else {
                                let fileStr = data.toString();
                                let nameStart = fileStr.indexOf(name.start) + name.start.length + 1;
                                let nameEnd = fileStr.indexOf("'", nameStart);
                                if (nameEnd === -1) nameEnd = fileStr.indexOf('"', nameStart);
                                let pathStart = fileStr.indexOf("const target: string = ", nameEnd)
                                    + "const target: string = ".length + 1;
                                let pathEnd = fileStr.indexOf("'", pathStart);
                                if (pathEnd === -1) pathEnd = fileStr.indexOf('"', pathStart);
                                let path = fileStr.slice(pathStart,pathEnd);
                                let infoStart = fileStr.indexOf(info.start) + info.start.length;
                                let infoEnd = fileStr.indexOf(info.end, infoStart)
                                let infoName = fileStr.slice(nameStart, nameEnd);
                                allInfo[infoName] = {};
                                allInfo[infoName].info = JSON.parse(fileStr.slice(infoStart, infoEnd));
                                allInfo[infoName].path = path;
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

const apiInfoPath = root+'aapig/apiInfo';
function getApiInfo() {
    return getInfo(apiInfoPath,
        {start: STARTAPIINFONAME},
        {start: STARTAPIINFO, end: ENDAPIINFO}).catch((error) => console.error(error));
}
const refbookInfoPath = root+'aapig/refbookInfo';
function getRefbookInfo() {
    return getInfo(refbookInfoPath,
        {start: STARTREFBOOKINFONAME},
        {start: STARTREFBOOKINFO, end: ENDREFBOOKINFO}).catch((error) => console.error(error));
}
const settingsPath = root + 'aapig/settings.json';
fs.readFile(settingsPath, (error, data) => {
    let serverHost, serverPort, interfaceHost, interfacePort;
    if (error) {
        if (error.code === 'ENOENT') {
            console.log('Файл настроек не был найден. Использованы настройки по умолчанию.')
        }
        serverHost = 'localhost';
        serverPort = 5480;
        interfaceHost = 'localhost';
        interfacePort = 5490;
    } else {
        settings = JSON.parse(data.toString());
        if (settings?.server) {
            serverHost = settings.server?.host;
            serverPort = Number(settings.server?.port);
            console.log('host:', serverHost, '\nport:', serverPort);
        } else {
            serverHost = 'localhost';
            serverPort = 5480;
        }
        if (settings?.interface) {
            interfaceHost = settings.interface.host;
            interfacePort = Number(settings.interface.port);
        } else {
            interfaceHost = 'localhost';
            interfacePort = 5490;
        }
    }
    if (serverHost && typeof serverHost === 'string' && serverPort && typeof serverPort === 'number' &&
        interfaceHost && typeof interfaceHost === 'string' && interfacePort && typeof interfacePort === 'number') {
        projectAddress = "http://" + interfaceHost + ":" + interfacePort;
        getApiInfo().then((apiInfo) => {
            allInfo.api = apiInfo;
            getRefbookInfo().then((refbookInfo) => {
                allInfo.refbook = refbookInfo;
                const server = http.createServer(requestListener);
                server.listen(serverPort, serverHost, () => {
                    console.log(`Сервер работы с файлами запущен по адресу http://${serverHost}:${serverPort}/aapig`);
                });
            })
        })
    } else {
        console.error('Настройки порта и/или хоста сервера заданы некорректно!')
    }
})





