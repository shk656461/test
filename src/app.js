import * as PIXI from 'pixi.js-legacy';

let m_App = null;

const width = 1024;
const height = 40 * 16 + 10;

function GetURLParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}


(function() {

    let forceCanvas = false;
    if (parseInt(GetURLParameter('canvas')))
        forceCanvas = true

    const view = document.getElementById('pixiCanvas')
    m_App = new PIXI.Application(
        {width:width, 
        height:height, 
        view: view,
        backgroundColor: 0xffffff,
        antialias: true,  
        forceCanvas: forceCanvas,
        autoStart: true});

    m_App.quads = parseInt(GetURLParameter('quads'));
    m_App.coloration = parseInt(GetURLParameter('coloration'));
    if (isNaN(m_App.coloration))
        m_App.coloration = 2;
    m_App.coloration_done = false;
  
})();


export {m_App};