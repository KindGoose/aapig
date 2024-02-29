import {ApiInfoList} from "../../generators/ApiGenerator.ts";
import {RefbookInfoList} from "../../generators/RefbookGenerator.ts";

interface ApiInfoForGeneration {
    [key: string]: ApiInfoList;
}
interface RefbookInfoForGeneration {
    [key: string]: RefbookInfoList;
}
interface allInfo {
    api: ApiInfoForGeneration;
    refbook: RefbookInfoForGeneration;
}
export function getAllInfo(): Promise<allInfo> {
    return new Promise((resolve) => {
        window.axios.get('http://localhost:5480/aapig/init', {
            headers: {
                Accept: "application/json,text/html"
            }
        }).then((response) => resolve(response.data))
    })
}
export function writeApi(apiFileString: string, path: string): void {
    window.axios.post('http://localhost:5480/aapig/writeFile', {file: apiFileString, path: path})
        .then((response) => console.log(response))
}