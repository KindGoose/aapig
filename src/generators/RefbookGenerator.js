
const generationHistory = {refbook: ''};

export function getGeneratedRefbook() {
    return generationHistory.refbook;
}
export function getImport(){
    return 'import {RefbookProxyHandler} from "@/refbooks/index.js";';
}
function generateRefbookFromInfo(refbookInfo, refbookName) {
    return {
        name: refbookName,
        url: refbookInfo.url,
        params: refbookInfo?.params,
        target: refbookInfo?.target
    }
}
function generateRefbookFromString(refbookUrl, refbookName) {
    return {
        name: refbookName,
        url: refbookUrl
    }
}
function generateRefbookFromGroup(refbookUrl, refbookName, refbookParams) {
    return {
        name: refbookName,
        url: refbookUrl,
        params: refbookParams
    }
}
function generateRefbookGroup(refbookGroup) {
    let refbookName;
    const group = [];
    for (refbookName in refbookGroup.children) {
        const refbookParams = {};
        let paramName;
        for (paramName in refbookGroup.children[refbookName]) {
            refbookParams[paramName] = refbookGroup.children[refbookName][paramName]
        }
        group.push(generateRefbookFromGroup(refbookGroup.url, refbookName, refbookParams));
    }
    return group;
}

export function generateRefbookFromList(refbookInfoList) {
    let name;
    const resultRefbook = {};
    generationHistory.refbook =
        'function getRefbookPromise(refbook, action) {\n' +
        '  return new Promise((resolve) => {\n' +
        '    refbook.then((data) => {\n' +
        '      if (action) {\n' +
        '        action(data);\n' +
        '        resolve(true);\n' +
        '      } else resolve(data);\n' +
        '    })\n' +
        '  })\n' +
        '}\n' +
        'const refbook = {\n';
    for (name in refbookInfoList) {
        if (typeof refbookInfoList[name] === 'string') {
            // console.log('String', refbookInfoList[name])
            resultRefbook[name] = generateRefbookFromString(refbookInfoList[name], name);
            generationHistory.refbook +=
                '  ' + name + ': {\n' +
                '    name: "' + name + '",\n' +
                '    url: "' + resultRefbook[name].url + '"\n  },\n';
        } else if (typeof refbookInfoList[name] === 'object') {
            const obj = refbookInfoList[name];
            if ('children' in obj) {
                // console.log('Group', refbookInfoList[name])
                const refbookGroupList = generateRefbookGroup(obj);
                let refbookIndex;
                for (refbookIndex in refbookGroupList) {
                    const refbookName = refbookGroupList[refbookIndex].name??'undefined';
                    resultRefbook[refbookName] = refbookGroupList[refbookIndex];
                    generationHistory.refbook +=
                        '  ' + refbookName + ': {\n' +
                        '    name: "' + refbookName + '",\n' +
                        '    url: "' + resultRefbook[refbookName].url + '",\n';
                    let paramName;
                    const params = resultRefbook[refbookName].params;
                    if (params) {
                        generationHistory.refbook += '    params: { ';
                        for (paramName in params) {
                            generationHistory.refbook += paramName + ': "' + params[paramName] + '", ';
                        }
                        generationHistory.refbook += '}\n';
                    }
                    generationHistory.refbook += '  },\n';
                }
            } else {
                // console.log('Object', refbookInfoList[name])
                resultRefbook[name] = generateRefbookFromInfo(obj, name);
                generationHistory.refbook +=
                    '  ' + name + ': {\n' +
                    '    name: "' + name + '",\n' +
                    '    url: "' + resultRefbook[name].url + '",\n';
                // console.log(resultRefbook[name])
                if ('target' in resultRefbook[name])
                    generationHistory.refbook += '    target: "' + resultRefbook[name].target + '",\n';
                let paramName;
                const params = resultRefbook[name].params;
                if (params) {
                    generationHistory.refbook += '    params: { ';
                    for (paramName in params) {
                        generationHistory.refbook += paramName + ': "' + params[paramName] + '", ';
                    }
                    generationHistory.refbook += '},\n'
                }
                const address = resultRefbook[name].address;
                if (address) {
                    generationHistory.refbook += '    address: "' + address + '"\n';
                }
                generationHistory.refbook += '  },\n';
            }
        }
    }
    generationHistory.refbook += '}\nconst exportRefbook = new Proxy(refbook, RefbookProxyHandler);\n\n';
    let refbookIndex;
    for (refbookIndex in resultRefbook) {
        generationHistory.refbook +=
            'export const ' + refbookIndex + ' = (action = null) => {\n' +
            '  return getRefbookPromise(exportRefbook.' + refbookIndex + ', action);\n' +
            '}\n'
    }
    return resultRefbook;
}