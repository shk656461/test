import * as d3 from 'd3';
import * as PIXI from 'pixi.js-legacy';
import Row from './align_row';

const {m_App} = require('./app')

class AlignRenderer 
{
    constructor(container) {
        this.alignment_box = new PIXI.Container();
        this.alignment_box.position.x = 0;
        this.alignment_box.interactive = true;
        container.addChild(this.alignment_box);
        
        this.colors = []
        var frequency = .3;
        for (let i = 0; i < 32; ++i) {
            this.colors[i] = new Float32Array(
                [Math.sin(frequency*i + 0),
                Math.sin(frequency*i + 2),
                Math.sin(frequency*i + 4)]);
        }
    
    }

    init(align_data) {
        this.align_data = align_data;
        this.row_meta = []
        let r = align_data.fetchRows();
        for (var i = 0; i < r.size(); i++) this.row_meta.push(r.get(i));
        r.delete();
        this.rows = this.row_meta.map(row => new Row(parseInt(row.id), align_data));
        this.align_info = align_data.getAlignInfo();
        m_App.aln_len = (this.align_info.aln_stop - this.align_info.aln_start) + 1;
        m_App.coloration_done = false;

        var xScale = d3.scaleLinear().domain([0, m_App.aln_len]).range([0, m_App.screen.width]);
        let curr_scale = (xScale.range()[1] - xScale.range()[0])/(xScale.domain()[1] - xScale.domain()[0])
        m_App.is_simplified  = (m_App.screen.width/curr_scale) > 100000;
        m_App.stage.scale.x = 1.0;
                
        var zoom = d3.zoom().scaleExtent([curr_scale, 10]).on('zoom', this.zoomed);

        var initialTransform = d3.zoomIdentity.translate(0, 0).scale(curr_scale);//width/aln_len);
        const zoom_rect = d3.select(m_App.view)
        zoom_rect.call(zoom.transform, initialTransform);
        zoom_rect.call(zoom);
        this.render_rows();

    }

    render_rows() {
        this.alignment_box.removeChildren();
        if (m_App.coloration > 0 && m_App.is_simplified == false && m_App.coloration_done == false) {
            console.time("Coloration calculation");
            this.align_data.applyColoration(m_App.coloration - 1, true); //m_App.renderer.type == 1);
            console.timeEnd("Coloration calculation");
            m_App.coloration_done = true;
        }
        let y = 0;
        this.rows.forEach(row => {
            this.alignment_box.addChild(row.draw(y));
            this.align_data.resetColoringBuffer(row.row_id);
            y += 16;
        });
    }
    
    zoomed() {
        var transform = d3.event.transform;
        if (d3.event.sourceEvent instanceof WheelEvent) {
            m_App.stage.position.x = transform.x;
            transform.y = m_App.stage.position.y;
             m_App.stage.scale.x = transform.k;
        } else {
            m_App.stage.position.x = transform.x;
            m_App.stage.position.y = transform.y;
        }
        //console.log(transform); 
        let visible_bases = m_App.screen.width/m_App.stage.scale.x;
        if (visible_bases <= 100000) {
            if (m_App.is_simplified) {
                m_App.is_simplified = false;
                this.render_rows();            
            }
        } else if (m_App.is_simplified  == false) {
            m_App.is_simplified = true;
            this.render_rows(); 
        }
    }

    apply_edge(edge) {
        this.alignment_box.children.forEach(a => {
            a.children.forEach(ch => {
                if (ch.shader) {
                ch.shader.uniformGroup.uniforms.uEdge = edge;
                }
            });
        });
    }
    apply_color(color) {
        const c = parseInt(color)
        if (c < 0 || c >= 32)
            return;
        this.alignment_box.children.forEach(a => {
            a.children.forEach(ch => {
                if (ch.shader) {
                    ch.shader.uniformGroup.uniforms.uMaxColor = this.colors[c]
                }
            });
        });
    }
    
}

export default AlignRenderer;

