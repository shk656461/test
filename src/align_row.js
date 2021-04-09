import * as PIXI from 'pixi.js-legacy';
const { getModule } = require('./data');
const {m_App} = require('./app')

const mesh_vert_shader = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;
uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTextureMatrix;
attribute vec2 aUvs;

varying vec2 vTextureCoord;
varying vec2 v;

void main(void)
{
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
    v = aUvs;
    vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;
}`;

const myShaderFrag = `
//varying vec2 vTextureCoord;
varying vec2 v;
uniform sampler2D uSampler;
uniform vec3 uMaxColor;
uniform float uEdge;
void main() {
vec4 currentColor = texture2D(uSampler, v);
vec3 color1 = vec3(0.87,0.87,0.87);
vec3 color2 = vec3(1.0,0.0,0.);
float a = currentColor.r;
if  (a < uEdge)
    a = 0.;
vec3 color = mix(color1, uMaxColor, a);
gl_FragColor = vec4(color,1.0);
}
`;

let uniform = {
    uMaxColor: new Float32Array([1., 0., 0.]),
    uEdge: 0.,
    k: 1.
}


let program = PIXI.Program.from(mesh_vert_shader, myShaderFrag, 'aaa');
let mesh_options = {program: program, uniforms: uniform}

class Row {
    constructor(row_id, align_data) {
        this.align_data = align_data;
        this.row_id = row_id;
    }
    data2canvas(w, data, is_rgba) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = w;
        this.canvas.height = 1;
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, w, 1);
        if (is_rgba == false) {
            let a = new Uint8ClampedArray(w * 4)
            let color1 = [222, 222, 222];
            let color2 = [255, 0, 0];
            let i = 0; 
            let k = 0;
            while (i < data.length) {
                let alpha = data[i]/255.;
                let c = [0, 0, 0]
                for (let j = 0; j < 3; ++j)  {
                    a[k + j] = Math.floor((color1[j] * (1. - alpha) + color2[j] * alpha) + 0.5);
                }
                a[k + 3] = 255;
                k += 4
                i += 1
            }
            const pix = new ImageData(a, w, 1);
            ctx.putImageData(pix, 0, 0);
        } else {
            const pix = new ImageData(data, w, 1);
            ctx.putImageData(pix, 0, 0);
        }
        return this.canvas;
    }
    mix(color1, color2, alpha) {
        let c1 = PIXI.utils.hex2rgb(color1);
        let c2 = PIXI.utils.hex2rgb(color2);
        let c3 = [0, 0, 0]
        for (let i = 0; i < 3; ++i) 
            c3[i] = c1[i] * (1 - alpha) + c2[i] *alpha;
        return  PIXI.utils.rgb2hex(c3);   
    }
    draw(y) 
    {
        const h = 14;
        const row_aln = this.align_data.fetchAlignment(this.row_id);
        const alignment = new PIXI.Container();
        alignment.position.set(row_aln.start, y)
        let coloring_buff_ptr = 0;
        if (m_App.is_simplified === false) {
            coloring_buff_ptr = this.align_data.getColoringBufferPtr(this.row_id);
        }
        //const filter = m_App.is_simplified == false && m_App.renderer.type == 1 ? new PIXI.Filter(undefined, myShaderFrag, uniform) : undefined;
        var pos = 0;
        let aln_pos = 0;
        for (let i = 0; i < row_aln.segments.size(); ++i) {
            var seg  = row_aln.segments.get(i);
            let w = Math.abs(seg.len)
            if (i % 2 === 0) {
                if (m_App.coloration == 0 || m_App.is_simplified) {
                    var graphics = new PIXI.Graphics();
                    graphics.beginFill(0xDEDEDE);
                    graphics.lineStyle(0);
                    graphics.drawRect(0, 0, w, h);
                    graphics.position.set(pos, 0);
                    alignment.addChild(graphics);
                } else if ( m_App.quads || w >= (12 * 1024)) {
                    let my_uint8_buffer = new Uint8Array(getModule().HEAPU8.buffer, coloring_buff_ptr + aln_pos, w);
                    let start  = pos;
                    let quad_l = 0;
                    let last_val = -1;
                    my_uint8_buffer.forEach((element, index, array) => {
                        if (last_val == -1 || last_val == element) {
                            last_val = element;
                            ++quad_l;
                        } else {
                            var graphics = new PIXI.Graphics();
                            let c = (w >= (12 * 1024)) ? 0x6291de : 0xDEDEDE;
                            graphics.beginFill(this.mix(c, 0xFF0000, last_val/255));
                            graphics.lineStyle(0);
                            graphics.drawRect(0, 0, quad_l, h);
                            graphics.position.set(start, 0);
                            alignment.addChild(graphics);
                            start += quad_l;
                            quad_l = 1;  
                            last_val = element;
                        }
                    });
                    if (quad_l > 0) {
                        var graphics = new PIXI.Graphics();
                        graphics.beginFill(this.mix(0xDEDEDE, 0xFF0000, last_val/255));
                        graphics.lineStyle(0);
                        graphics.drawRect(0, 0, quad_l, h);
                        graphics.position.set(start, 0);
                        alignment.addChild(graphics);
                    }

                } else if (/*m_App.aln_len < (12 * 1024) && */m_App.renderer.type == 1) {
                    let my_uint8_buffer = new Uint8Array(getModule().HEAPU8.buffer, coloring_buff_ptr + aln_pos, w);
                    // format RGB 6407
                    // type Uint8 5121   
                    //scaleMode: PIXI.NEAREST

                    var dataTex = new PIXI.Texture.fromBuffer(my_uint8_buffer, w, 1, {format : 6409, type: 5121, scaleMode: "NEAREST"}); 
                    dataTex.update();

                        
                    /* Sprite with filter
                    const sprite = new PIXI.Sprite(dataTex);
                    sprite.height = h;
                    sprite.position.set(pos, 0);
                    sprite.filters=[filter];
                    alignment.addChild(sprite);
                    */
                    const geometry = new PIXI.Geometry()
                        .addAttribute('aVertexPosition', [0, 0, w, 0, w, h, 0, h], 2) 
                        .addAttribute('aUvs', [0, 0, 1, 0, 1, 1, 0, 1], 2)
                        .addAttribute('aTextureCoord', [0, 0, 1, 0, 1, 1, 0, 1], 2)
                        .addIndex([0, 1, 2, 0, 2, 3]);
                        
/*
                        var shader = PIXI.Shader.from(particleVertexSrc, myShaderFrag, uniform);
                        shader.uniforms.uSampler = dataTex;
                        shader.uniforms.w = parseFloat(w) ;
                        const quad = new PIXI.Mesh(geometry, shader);
                        quad.position.set(pos, 0, w, h);
                        alignment.addChild(quad);
*/
                        
                        let mat = new PIXI.MeshMaterial(dataTex, mesh_options);
                        const quad = new PIXI.Mesh(geometry, mat);
                        quad.position.set(pos, 0, w, h);
                        alignment.addChild(quad);
                        
                } else {
                    //let data = new Uint8ClampedArray(Module.HEAPU8.buffer, coloring_buff_ptr + aln_pos  * 4, w * 4);
                    let data = new Uint8ClampedArray(getModule().HEAPU8.buffer, coloring_buff_ptr + aln_pos, w);
                    let canvas = this.data2canvas(w, data, false);
                    const texture = PIXI.Texture.from(canvas, {scaleMode: PIXI.SCALE_MODES.NEAREST});
                    const sprite = new PIXI.Sprite(texture);
                    //if (filter)
                    //    sprite.filters = [filter];
                    sprite.height = h;
                    sprite.position.set(pos, 0);//, w, h);
                    alignment.addChild(sprite);
                    
                }
                aln_pos += w;
                
            } else {
                const graphics = new PIXI.Graphics();
                graphics.lineStyle(1, 0xAAAAAA);
                graphics.moveTo(pos, h/2);
                graphics.lineTo(pos + w, h/2);
                alignment.addChild(graphics);
                
            }
            pos += w;
        }
        return alignment;
    }

};

export default Row;