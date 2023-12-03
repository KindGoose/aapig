import { projectAddress as baseAddress, validateResponse } from "../index.js"

const api = {
    file: {
        delete: (file) => {
            let request = window.axios.delete(baseAddress + "writeFile",
                { params: { file:file } });
            return new Promise((resolve,reject) => validateResponse(request, resolve, reject));
        },
        get: (file) => {
            if (!file) new Error("Обязательный параметр 'file' не определен!");
            let p = { file: file};
            let request = window.axios.get(baseAddress + "writeFile",
                { params: p });
            return new Promise((resolve,reject) => validateResponse(request, resolve, reject));
        },
        post: (data) => {
            let request = window.axios.post(baseAddress + "writeFile", data );
            return new Promise((resolve,reject) => validateResponse(request, resolve, reject));
        },
        put: (file, data) => {
            let request = window.axios.put(baseAddress + "writeFile", data,
                { params: { file:file } });
            return new Promise((resolve,reject) => validateResponse(request, resolve, reject));
        },
    },
}
export default api;