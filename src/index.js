import * as d3 from 'd3';

const {m_App} = require('./app')
const { getAlignment, getModule } = require('./data');
import AlignRenderer from './align_renderer';

const renderer = new AlignRenderer(m_App.stage);
var data_file = 'align.data';
//if (parseInt(GetURLParameter('big_data')))
    //data_file = 'data/align_data_big.data';

getAlignment(data_file).then((align_data) => {
    renderer.init(align_data);
});

d3.select('#label').text("Rendering context: " + (m_App.renderer.type== 1 ? "WebGl" : "canvas"));
d3.select("#edge").on("input", function() {
    renderer.apply_edge(this.value / 128.)    
});

d3.select("#maxColor").on("input", function() {
    renderer.apply_color(this.value)    
});