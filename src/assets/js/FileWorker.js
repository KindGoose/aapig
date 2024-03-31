export function getAllInfo(){
    return new Promise((resolve) => {
        window.axios.get('http://localhost:5480/aapig/init', {
            headers: {
                Accept: "application/json,text/html"
            }
        }).then((response) => resolve(response.data))
    })
}
export function writeApi(apiFileString, path) {
    window.axios.post('http://localhost:5480/aapig/writeFile', {file: apiFileString, path: path})
        .then((response) => console.log(response))
}