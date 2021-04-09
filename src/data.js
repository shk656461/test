import Wasm from './align_data';

let WasmModule = null

function getModule() 
{
    return WasmModule
}

async function fetchModule() 
{
    return await Wasm({locateFile(path) {return path}}).then((Module) => {
        WasmModule = Module;
        return WasmModule;
    });
}

function getData(url) {
    return fetch(url, {
        cache: 'no-cache',
        credentials: 'omit'
    })
    .then(function(rs){
        if(rs.ok){
            return rs.arrayBuffer();
        }else{
            throw new Error('HTTP Error ' + rs.status);
        }
    })
    .then(function(data){
        return data; // ArrayBuffer
    });
}

function getAlignment(url)
{
    const _data = getData(url).then((data) => {
        console.log(url + " fetched")
        let align_data = null;
        if (WasmModule == null) {
            align_data = fetchModule().then((Module) => {
                WasmModule = Module;
                return new WasmModule.CAlignData(data);
            });
        } else {
            align_data = new WasmModule.CAlignData(data);
        }
        return align_data;
    }); 
    return _data;

}


export { getAlignment, getModule };
