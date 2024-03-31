/**
 * История генерации включающая в себя историю сгенерированных методов.
 * @type {{baseAddress: string, api: string, sortedApiInfo: string}}
 */
const generationHistory = {
    api: '',
    baseAddress: '',
    sortedApiInfo: ''
}

/**
 * Возвращает {@link generationHistory историю генерации}.
 * @returns {string|string|*}
 */
export function getGeneratedMethods() {
    return generationHistory.api;
}

export function clearGeneratedMethods() {
    generationHistory.api = 'const api = {\n';
}

// export function getBaseAddress() {
//     return generationHistory.baseAddress;
// }

// export function getImportAddress() {
//     return 'import { baseAddress } from "./index.js"'
// }
//
// export function getImportValidate() {
//     return 'import { validateResponse } from "./index.js"';
// }

export function getSortedApiInfo() {
    // return 'const get = "get";\nconst post = "post";\n' +
    //     'const put = "put";\nconst del = "delete";\n' + generationHistory.sortedApiInfo;
    return generationHistory.sortedApiInfo;
}

export function getImport() {
    return 'import { baseAddress, validateResponse, getParams } from "@/api/index.ts"'
}

// /**
//  * Проверяет наличие "http(s)://" в составе входной строки.
//  * @param url
//  */
// function checkAddress(url) {
//     return url.indexOf('http://') !== -1 || url.indexOf('https://') !== -1;
// }

// /**
//  * Функция устанавливающая базовый адрес для генерируемых API.
//  * @param address
//  */
// export function setBaseAddress(address) {
//     if (checkAddress(address)) {
//         generationHistory.baseAddress = 'let baseAddress = "' + address + '";';
//     } else throw new Error('Неверно задан базовый адрес!\n"' + address + '"');
// }

function checkOptionalInfoField(fieldName, apiInfo) {
    if (fieldName in apiInfo) {
        let fieldValue = apiInfo[fieldName];
        if (fieldValue) return Number(fieldValue.length) > 0;
        else return false;
    } else return true;

}

function checkInfoMethods(apiInfo) {
    return apiInfo.methods.length > 0;
}

function checkApiInfo(apiName, apiInfo) {
    let fieldName;
    for (fieldName in apiInfo) {
        if (!checkOptionalInfoField(fieldName, apiInfo)) {
            throw new Error('Неверно заполнено поле "' + fieldName + '"\nу API "' + apiName + '"!');
        }
    }
    if (!checkInfoMethods(apiInfo))
        throw new Error('Необходим хотя бы один метод для API "' + apiName + '"!')
    return true;
}

/**
 * Формирует конечный URL для API.
 * @param apiName Имя API
 * @param apiInfo описание API
 */
function checkApiInfoAndBaseAddress(apiName, apiInfo) {
    if (checkApiInfo(apiName, apiInfo) && ('address' in apiInfo) && !apiInfo.address)
        throw new Error('Не верно определён address у запрашиваемого API!')
}

/**
 * Формирует конечный URL для списка API.
 * @param apiInfoList список описаний API
 */
function checkApiInfoList(apiInfoList) {
    let apiName;
    for (apiName in apiInfoList)
        checkApiInfoAndBaseAddress(apiName, apiInfoList[apiName]);
}

function sortAZ(a, b) {
    return a > b ? 1 : -1;
}

const optionalFields = [
    'address',
    'requiredParams',
    'optionalParams',
    'constParams',
    'putParam',
    'deleteParam'
]

function sortApiInfoFields(apiInfo) {
    const result = {
        url: apiInfo.url,
        methods: apiInfo.methods.sort(sortAZ)
    };
    let fieldName;
    for (fieldName of optionalFields) {
        if (fieldName in apiInfo) {
            let fieldValue = apiInfo[fieldName]
            if (fieldValue) {
                if (!result[fieldName]) {
                    // @ts-ignore
                    result[fieldName] = fieldValue;
                }
            }

        }
    }
    for (fieldName in result) {
        generationHistory.sortedApiInfo += '    ' + fieldName + ': ' + JSON.stringify(result[fieldName]) + ',\n';
    }
    return result;
}

export function sortApiInfo(apiInfoList) {
    if (apiInfoList && Object.keys(apiInfoList)?.length) {
        let sortedApiInfoNames = [];
        let apiInfoName;
        for (apiInfoName in apiInfoList) {
            sortedApiInfoNames.push(apiInfoName);
        }
        sortedApiInfoNames = sortedApiInfoNames.sort(sortAZ);
        const result = {};
        const collectedApiUrl = [];
        generationHistory.sortedApiInfo = 'const apiInfo = {\n';
        for (apiInfoName of sortedApiInfoNames) {
            generationHistory.sortedApiInfo += '  ' + apiInfoName + ': {\n';
            result[apiInfoName] = sortApiInfoFields(apiInfoList[apiInfoName]);
            generationHistory.sortedApiInfo += '  },\n';
            if (collectedApiUrl.find((x) => x === apiInfoList[apiInfoName].url))
                console.warn('Обнаружено избыточное использование url: "' + apiInfoList[apiInfoName].url + '"');
            collectedApiUrl.push(apiInfoList[apiInfoName].url)
        }
        generationHistory.sortedApiInfo += '}\nexport default apiInfo;\n';
        return result;
    } else return {};
}

function getRequiredParamsValidator(apiInfo, func) {
    if (apiInfo.requiredParams?.length) {
        let param;
        for (param of apiInfo.requiredParams) {
            func.body += '      if (!' + param + ') new Error("Обязательный параметр \'' + param + '\' не определен!");\n'
        }
    }
}

function getStringParams(apiInfo, paramsType, first = true) {
    if (paramsType in apiInfo) {
        let param;
        let paramsString = '';
        let paramsArray = apiInfo[paramsType];
        if (paramsArray) {
            for (param of paramsArray) {
                paramsString += first ? '' : ',';
                first = false;
                paramsString += "'" + param + "'";
            }
        }

        return paramsString;
    } else return '';
}

function getStringRequiredAndOptionalParams(apiInfo) {
    const requiredParams = getStringParams(apiInfo, 'requiredParams');
    return requiredParams + getStringParams(apiInfo, 'optionalParams', !requiredParams);
}

/**
 * Генерирует строку с постоянными параметрами для тела функции.
 * @param apiInfo описание API
 * @returns {string} строка с инициализацией постоянных параметров
 */
function getStringConstantParams(apiInfo) {
    if (apiInfo.constParams) {
        let paramsString = '';
        let param;
        for (param of apiInfo.constParams) {
            paramsString += '      p.' + param + ';\n';
        }
        return paramsString;
    } else return '';
}

/**
 * @param apiInfo описание API
 * @param func объект содержащий все параметры функции и строковое представление его тела
 */
function parseRequiredAndOptionalParams(apiInfo, func) {
    if ('requiredParams' in apiInfo && apiInfo.requiredParams)
        func.params = func.params.concat(apiInfo.requiredParams);
    if ('optionalParams' in apiInfo && apiInfo.optionalParams)
        func.params = func.params.concat(apiInfo.optionalParams);
    func.body += '      let op = [' + getStringRequiredAndOptionalParams(apiInfo) + '];\n';
}

/**
 * При наличии постоянных параметров в описании API
 * генерирует для них строку и конкатенирует её с телом функции.
 * Постоянные параметры не указываются при вызове методов,
 * поэтому не добавляются в список всех параметров функции "<b><i>func.params</i></b>".
 * @param apiInfo описание API
 * @param func объект содержащий все параметры функции и строковое представление его тела
 */
function parseConstantParams(apiInfo, func) {
    if ('constParams' in apiInfo)
        func.body += getStringConstantParams(apiInfo);
}

function getHeadersString(apiInfo) {
    let result = '{ ';
    let headerName;
    if ('headers' in apiInfo && apiInfo.headers) {
        for (headerName in apiInfo.headers) {
            if (apiInfo.headers[headerName]) {
                result += headerName + ': ';
                if (headerName === 'Origin' && apiInfo.headers[headerName][0] === '~')
                    result += apiInfo.headers[headerName].slice(1);
                else if (headerName === 'Access-Control-Request-Methods') {
                    let methodsString = '';
                    let method;
                    for (method of apiInfo.methods) {
                        methodsString += method + (methodsString ? ', ' : '"')
                    }
                    methodsString += '"';
                    result += methodsString;
                } else {
                    result += '"' + apiInfo.headers[headerName] + '"';
                }
                result += ', ';
            } else {
                console.warn('Заголовок "' + headerName + '" не был вставлен!');
            }
        }
    }
    result += ' }';
    return result;
}

function getHeaders(apiInfo, method) {
    if (method === 'post') {
        return ', { headers: ' + getHeadersString(apiInfo) + ' });';
    } else {
        return ', headers: ' + getHeadersString(apiInfo) + ' });';
    }
}

/**
 * Генерирует строку вызова axios.
 * @param apiInfo описание API
 * @param func объект содержащий все параметры функции и строковое представление его тела
 * @param method один из методов "get", "post", "put", "delete"
 */
function getStringAxiosCall(apiInfo, func, method) {
    func.body += '      let request = window.axios.' + method + '(';
    if ('address' in apiInfo) func.body += '"' + apiInfo.address + '"';
    else func.body += 'baseAddress';
    func.body += ' + "' + apiInfo.url + '", ';
    const putParam = 'putParam' in apiInfo && apiInfo['putParam'] ? String(apiInfo.putParam) : 'Id';
    const deleteParam = 'deleteParam' in apiInfo && apiInfo['deleteParam'] ? String(apiInfo.deleteParam) : 'Id';
    switch (method) {
        case 'get':
            func.body += '\n        { params: p';
            break;
        case 'post':
            func.params.push('data');
            func.body += 'data';
            break;
        case 'put':
            func.params.push(putParam);
            func.params.push('data');
            func.body += 'data,\n        { params: { ' + putParam + ':' + putParam + ' }';
            break;
        case 'delete':
            func.params.push(deleteParam)
            func.body += '\n        { params: { ' + deleteParam + ':' + deleteParam + ' }';
            break;
        default:
            console.error('Указанный метод "' + method + '" не поддерживается!');
    }
    if ('headers' in apiInfo) {
        func.body += getHeaders(apiInfo, method);
    } else {
        if (method === 'post') {
            func.body += ' );';
        } else {
            func.body += ' });'
        }
    }
    func.body += '\n      return new Promise((resolve,reject) => validateResponse(request, resolve, reject));'
    // console.log(func.body);
}

/**
 * Генерирует метод API
 * @param apiInfo описание API
 * @param method один из методов "get", "post", "put", "delete"
 * @returns {Function} функция вызывающая соответсвующий метод через axios
 */
function generateMethod(apiInfo, method) {
    const func = {params: [], body: ''};
    if (method === 'get') {
        getRequiredParamsValidator(apiInfo, func);
        // Если формируемая функция get - заранее формируем объект параметров.
        // func.body += '      let p = { ';
        parseRequiredAndOptionalParams(apiInfo, func);
        func.body += '      let p = getParams(arguments, op);\n';
        // func.body += '};\n';
        parseConstantParams(apiInfo, func)
    }
    // формирование возврата объекта запроса.
    getStringAxiosCall(apiInfo, func, method);
    // Генерация полученной функции.

    generationHistory.api += '    ' + method + '(';
    let param;
    for (param of func.params) {
        generationHistory.api += param + ', ';
    }
    if (func.params.length)
        generationHistory.api = generationHistory.api.slice(0, -2);
    generationHistory.api += ') {\n' + func.body + '\n    },\n';
    return new Function(...func.params, func.body);
}

/**
 * Генерирует объект API.
 * @param apiInfo описание API
 * @returns {Object} объект API с соответствующими методами.
 */
export function generateApi(apiInfo) {
    const apiObject = {}; // Создание объекта API
    let method;
    for (method of apiInfo.methods) {
        apiObject[method] = generateMethod(apiInfo, method);
    }
    return apiObject;
}

/**
 * Генерирует объекты API для заданного списка и формирует из них объект.
 * @param apiInfoList список описаний API
 */
export function generateApiForList(apiInfoList) {
    checkApiInfoList(apiInfoList);
    const api = {};
    let apiName;
    for (apiName in apiInfoList) {
        generationHistory.api += '  ' + apiName + ': {\n';
        api[apiName] = generateApi(apiInfoList[apiName]);
        generationHistory.api += '  },\n';
    }
    generationHistory.api += '}\nexport default api;';
    return api;
}

/**
 * Функция генерирующая комментарии JavaDoc
 * @param apiParams определяет список API для которого генерировать документацию.
 * @param withCode определяет будет ли добавляться код описания API
 * @returns {string} строка документации с кодом описания API или без
 */
// export function getDocumentation(apiParams, withCode = true) {
//     let sortApi = [];
//     for (let apiName in apiParams) {
//         apiParams[apiName]['name'] = apiName;
//         sortApi.push(apiParams[apiName]);
//     }
//     sortApi.sort((a,b)=>a.name>b.name?1:-1);
//     // Формирование нового содержимого js
//     let jsCode = '';
//     for (let api of sortApi) {
//         let br = '<br>';
//         let codeFragment = '', docFragment = '';
//         codeFragment += api.name + ": {\n";
//         docFragment += "/**\n";
//         if (api?.description) {
//             docFragment += " * " + api.description + "\n";
//         }
//         if (withCode) {
//             if (api?.url) {
//                 codeFragment += "url: '" + api.url + "',\n";
//             }
//             if (api?.address) {
//                 docFragment += " * Небазовый адрес API: " + api.address + "\n";
//                 codeFragment += "address: '" + api.address + "',\n";
//             }
//             if (api?.requiredParams) {
//                 codeFragment += "requiredParams: [";
//                 for (let param of api.requiredParams) {
//                     codeFragment += "'" + param + "', ";
//                 }
//                 codeFragment += "],\n"
//             }
//             if (api?.optionalParams) {
//                 codeFragment += "optionalParams: [";
//                 for (let param of api.optionalParams) {
//                     codeFragment += "'" + param + "', ";
//                 }
//                 codeFragment += "],\n"
//             }
//             if (api?.constParams) {
//                 codeFragment += "constParams: {\n";
//                 for (let paramName in api.constParams) {
//                     codeFragment += paramName + ": '" +
//                         api.constParams[paramName] + "',\n";
//                 }
//                 codeFragment += "},\n"
//             }
//             if (api?.methods) {
//                 codeFragment += "methods: [";
//                 for (let method of api.methods) {
//                     codeFragment += "'" + method + "', ";
//                 }
//                 codeFragment += "],\n"
//             }
//             if ('deleteParam' in api) {
//                 codeFragment += "deleteParam: '" + api.deleteParam + "',\n";
//             }
//             if ('putParam' in api) {
//                 codeFragment += "putParam: '" + api.putParam + "',\n";
//             }
//         }
//         codeFragment += "},\n";
//         docFragment += " * @code \n";
//         if (api.methods.find((x:string)=>x === 'get')) {
//             docFragment += " * "+ br + " // get function " + br +
//                 "\n * api." + api.name + ".get(" + br + "\n";
//             if (api?.requiredParams) {
//                 docFragment += " * " + br + "// необходимые параметры" + br + "\n"
//                 for (let param of api.requiredParams){
//                     docFragment += " * " + br + " " + param + ",\n";
//                 }
//             }
//             if (api?.optionalParams) {
//                 docFragment += " * " + br + "// необязательные параметры" + br + "\n"
//                 for (let param of api.optionalParams){
//                     docFragment += " * " + br + " " + param + ",\n";
//                 }
//             }
//             docFragment += " * )\n";
//         }
//         docFragment += " */"
//         jsCode += docFragment + '\n' + codeFragment;
//     }
//     return jsCode;
// }
//
