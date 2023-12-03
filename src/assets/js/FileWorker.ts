interface infoFileNames {
    [index: string]: string
}
export function getAllInfo(): Promise<infoFileNames> {
    return new Promise((resolve) => {
        window.axios.get('http://localhost:5480/aapig/init', {
            headers: {
                Accept: "application/json,text/html"
            }
        }).then((response) => resolve(response.data))
    })
}