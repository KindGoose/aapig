interface RefbookInfoObject {
    url: string;
    params?: RefbookParams;
    address?: string;
    target?: string;
}
interface RefbookGroupChildren {
    [index:string]: RefbookGroupChildrenArray;
}
interface RefbookGroupChildrenArray {
    [index:string]: string;
}
interface RefbookGroup {
    url: string,
    children: RefbookGroupChildren;
}
export interface RefbookInfoList {
    [index:string]: RefbookInfoObject | string | RefbookGroup;
}
interface RefbookGenerationHistory {
    refbook: string;
}
interface Refbook {
    url: string;
    name?: string;
    target?: string;
    params?: RefbookParams;
    address?: string;
}
interface RefbookList {
    [index:string]: Refbook;
}
interface RefbookParams {
    [index:string]: string;
}
const generationHistory: RefbookGenerationHistory = {refbook: ''};

export function getGeneratedRefbook(): string {
    return generationHistory.refbook;
}
export function getImport(): string{
    return 'import {RefbookProxyHandler} from "@/refbooks/index.js";';
}
function generateRefbookFromInfo(refbookInfo: RefbookInfoObject, refbookName: string): Refbook {
    return {
        name: refbookName,
        url: refbookInfo.url,
        params: refbookInfo?.params,
        target: refbookInfo?.target
    }
}
function generateRefbookFromString(refbookUrl: string, refbookName: string): Refbook {
    return {
        name: refbookName,
        url: refbookUrl
    }
}
function generateRefbookFromGroup(refbookUrl: string, refbookName: string, refbookParams: RefbookParams): Refbook {
    return {
        name: refbookName,
        url: refbookUrl,
        params: refbookParams
    }
}
function generateRefbookGroup(refbookGroup: RefbookGroup): Array<Refbook> {
    let refbookName: string;
    const group: Array<Refbook> = [];
    for (refbookName in refbookGroup.children) {
        const refbookParams: RefbookParams = {};
        let paramName: string;
        for (paramName in refbookGroup.children[refbookName]) {
            refbookParams[paramName] = refbookGroup.children[refbookName][paramName]
        }
        group.push(generateRefbookFromGroup(refbookGroup.url, refbookName, refbookParams));
    }
    return group;
}

export function generateRefbookFromList(refbookInfoList: RefbookInfoList): RefbookList {
    let name: string;
    const resultRefbook: RefbookList = {};
    generationHistory.refbook = 'const refbook = {\n';
    for (name in refbookInfoList) {
        if (typeof refbookInfoList[name] === 'string') {
            // console.log('String', refbookInfoList[name])
            resultRefbook[name] = generateRefbookFromString(<string>refbookInfoList[name], name);
            generationHistory.refbook +=
                '  ' + name + ': {\n' +
                '    name: "' + name + '",\n' +
                '    url: "' + resultRefbook[name].url + '"\n  },\n';
        } else if (typeof refbookInfoList[name] === 'object') {
            const obj: object = <object>refbookInfoList[name];
            if ('children' in obj) {
                // console.log('Group', refbookInfoList[name])
                const group: RefbookGroup = <RefbookGroup>obj;
                const refbookGroupList: Array<Refbook> = generateRefbookGroup(group);
                let refbookIndex: string;
                for (refbookIndex in refbookGroupList) {
                    const refbookName: string = refbookGroupList[refbookIndex].name;
                    resultRefbook[refbookName] = refbookGroupList[refbookIndex];
                    generationHistory.refbook +=
                        '  ' + refbookName + ': {\n' +
                        '    name: "' + refbookName + '",\n' +
                        '    url: "' + resultRefbook[refbookName].url + '",\n';
                    let paramName: string;
                    const params: RefbookParams | undefined = resultRefbook[refbookName].params;
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
                resultRefbook[name] = generateRefbookFromInfo(<RefbookInfoObject>obj, name);
                generationHistory.refbook +=
                    '  ' + name + ': {\n' +
                    '    name: "' + name + '",\n' +
                    '    url: "' + resultRefbook[name].url + '",\n';
                console.log(resultRefbook[name])
                if ('target' in resultRefbook[name])
                    generationHistory.refbook += '    target: "' + resultRefbook[name].target + '",\n';
                let paramName: string;
                const params: RefbookParams | undefined = resultRefbook[name].params;
                if (params) {
                    generationHistory.refbook += '    params: { ';
                    for (paramName in params) {
                        generationHistory.refbook += paramName + ': "' + params[paramName] + '", ';
                    }
                    generationHistory.refbook += '},\n'
                }
                const address: string | undefined = resultRefbook[name].address;
                if (address) {
                    generationHistory.refbook += '    address: "' + address + '"\n';
                }
                generationHistory.refbook += '  },\n';
            }
        }
    }
    generationHistory.refbook += '}\nconst exportRefbook = new Proxy(refbook, RefbookProxyHandler);\n\n';
    let refbookIndex: string;
    for (refbookIndex in resultRefbook) {
        generationHistory.refbook += 'export const ' + refbookIndex + ' = (action) => {\n' +
            '  return new Promise((resolve) => { \n'+
            '    exportRefbook.' + refbookIndex + '.then((data) => {\n' +
            '      action(data);\n' +
            '      resolve(data);\n' +
            '    })\n  })\n};\n';
    }
    return resultRefbook;
}