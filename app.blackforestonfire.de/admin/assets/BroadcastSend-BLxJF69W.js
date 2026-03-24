import{B as l,a as s,s as a,n,b as i}from"./index-DM9i3pX3.js";class r extends l{#t={title:"",body:""};#s={title:"",body:""};#a={title:"",body:""};#e="";#o=null;#h=!1;#c=[];#d=[];#n=!1;#r=!1;#l="";#i=null;async connectedCallback(){super.connectedCallback(),this.#i=this.location?.params?.id??null,await this.#p(),await this.#g(),this.#i&&await this.#y()}async#p(){try{const e=await s("/api/broadcasts/tags");this.#c=await e.json(),this.triggerViewUpdate()}catch{}}async#g(){try{const e=await fetch("/api/artists");this.#d=await e.json(),this.triggerViewUpdate()}catch{}}get#b(){return["","/","/running-order#main-stage","/running-order#family","/running-order#surprise","/running-order#sea","/lineup",...this.#d.map(e=>`/lineup/${e.slug}`),"/news","/mehr","/mehr/karte","/mehr/camping","/mehr/merch","/mehr/infos"]}async#y(){try{const e=await s(`/api/scheduled-broadcasts/${this.#i}`);if(!e.ok)throw new Error(`HTTP ${e.status}`);const t=await e.json();this.#t={title:t.titleDe,body:t.bodyDe},this.#s={title:t.titleFr,body:t.bodyFr},this.#a={title:t.titleEn,body:t.bodyEn},this.#e=t.url??"/",this.#o=t.tag??null,this.#h=t.renotify,this.#l=t.scheduledAt?.slice(0,16)??"",this.#r=!0}catch{a("error","Fehler beim Laden der Nachricht.")}this.triggerViewUpdate()}async#$(){if(!(!this.#t.title&&!this.#t.body)){this.#n=!0,this.triggerViewUpdate();try{const t=await(await s("/api/translations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:this.#t.title,body:this.#t.body})})).json();this.#s=t.fr??{title:"",body:""},this.#a=t.en??{title:"",body:""}}catch{}finally{this.#n=!1,this.triggerViewUpdate()}}}async#m(e){e.preventDefault();const t={de:this.#t,fr:this.#s,en:this.#a,url:this.#e||null,tag:this.#o||null,renotify:this.#h};try{this.#i?(await this.#w({...t,scheduledAt:new Date(this.#l).toISOString()}),n("/admin/scheduled")):this.#r&&this.#l?(await this.#f({...t,scheduledAt:new Date(this.#l).toISOString()}),a("success",`Nachricht geplant für ${new Date(this.#l).toLocaleString("de-DE")}.`),this.#u()):(await this.#v(t),a("success","Nachricht wurde versendet."),this.#u())}catch{a("error","Fehler beim Senden. Bitte erneut versuchen.")}}async#v(e){const t=await s("/api/broadcasts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`HTTP ${t.status}`)}async#f(e){const t=await s("/api/scheduled-broadcasts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`HTTP ${t.status}`)}async#w(e){const t=await s(`/api/scheduled-broadcasts/${this.#i}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!t.ok)throw new Error(`HTTP ${t.status}`)}#u(){this.#t={title:"",body:""},this.#s={title:"",body:""},this.#a={title:"",body:""},this.#e="",this.#o=null,this.#h=!1,this.#r=!1,this.#l="",this.triggerViewUpdate()}view(){return i`
            <div class="config-section">
                <h2>${this.#i?"Nachricht bearbeiten":"Neue Nachricht"}</h2>

                <div class="broadcast-languages">
                    <fieldset>
                        <legend>Deutsch</legend>
                        <label>Titel
                            <input type="text" .value=${this.#t.title}
                                   @input=${e=>{this.#t.title=e.target.value}}
                                   placeholder="Titel">
                        </label>
                        <label>Nachricht
                            <input type="text" .value=${this.#t.body}
                                   @input=${e=>{this.#t.body=e.target.value}}
                                   placeholder="Nachricht">
                        </label>
                        <button type="button" class="secondary-button"
                                ?disabled=${this.#n}
                                @click=${()=>this.#$()}>
                            ${this.#n?"Wird übersetzt…":"Übersetzen"}
                        </button>
                    </fieldset>

                    <fieldset ?disabled=${this.#n}>
                        <legend>Français ${this.#n?i`<small>(wird übersetzt…)</small>`:""}</legend>
                        <label>Titre
                            <input type="text" .value=${this.#s.title}
                                   @input=${e=>{this.#s.title=e.target.value}}
                                   placeholder="Titre">
                        </label>
                        <label>Message
                            <input type="text" .value=${this.#s.body}
                                   @input=${e=>{this.#s.body=e.target.value}}
                                   placeholder="Message">
                        </label>
                    </fieldset>

                    <fieldset ?disabled=${this.#n}>
                        <legend>English ${this.#n?i`<small>(translating…)</small>`:""}</legend>
                        <label>Title
                            <input type="text" .value=${this.#a.title}
                                   @input=${e=>{this.#a.title=e.target.value}}
                                   placeholder="Title">
                        </label>
                        <label>Body
                            <input type="text" .value=${this.#a.body}
                                   @input=${e=>{this.#a.body=e.target.value}}
                                   placeholder="Body">
                        </label>
                    </fieldset>
                </div>

                <fieldset>
                    <legend>Versand</legend>
                    <label>Ziel-URL
                        <select @change=${e=>{this.#e=e.target.value}}>
                            <option value="" ?selected=${this.#e===""}>--- Keine URL ---</option>
                            ${this.#b.includes(this.#e)?"":i`
                                <option value=${this.#e} selected>Gespeicherter Link: ${this.#e}</option>
                            `}
                            <optgroup label="Running Order">
                                <option value="/" ?selected=${this.#e==="/"}>Running Order</option>
                                <option value="/running-order#main-stage" ?selected=${this.#e==="/running-order#main-stage"}>Running Order → Main Stage</option>
                                <option value="/running-order#family" ?selected=${this.#e==="/running-order#family"}>Running Order → Family Stage</option>
                                <option value="/running-order#surprise" ?selected=${this.#e==="/running-order#surprise"}>Running Order → Surprise Stage</option>
                                <option value="/running-order#sea" ?selected=${this.#e==="/running-order#sea"}>Running Order → Sea Stage</option>
                            </optgroup>
                            <optgroup label="Lineup">
                                <option value="/lineup" ?selected=${this.#e==="/lineup"}>Lineup Übersicht</option>
                                ${this.#d.map(e=>i`
                                    <option value=${`/lineup/${e.slug}`} ?selected=${this.#e===`/lineup/${e.slug}`}>
                                        Lineup → ${e.name}
                                    </option>
                                `)}
                            </optgroup>
                            <optgroup label="Weitere Seiten">
                                <option value="/news" ?selected=${this.#e==="/news"}>News</option>
                                <option value="/mehr" ?selected=${this.#e==="/mehr"}>Mehr</option>
                                <option value="/mehr/karte" ?selected=${this.#e==="/mehr/karte"}>Geländeplan</option>
                                <option value="/mehr/camping" ?selected=${this.#e==="/mehr/camping"}>Camping</option>
                                <option value="/mehr/merch" ?selected=${this.#e==="/mehr/merch"}>Merch</option>
                                <option value="/mehr/infos" ?selected=${this.#e==="/mehr/infos"}>Infos</option>
                            </optgroup>
                        </select>
                    </label>
                    <label>Kategorie
                        <select @change=${e=>{this.#o=e.target.value||null,this.triggerViewUpdate()}}>
                            <option value="">— Kein Tag (Nachrichten stapeln) —</option>
                            ${this.#c.map(e=>i`
                                <option value=${e} ?selected=${this.#o===e}>${e}</option>
                            `)}
                        </select>
                    </label>
                    <label ?hidden=${!this.#o}>
                        <input type="checkbox" .checked=${this.#h}
                               @change=${e=>{this.#h=e.target.checked}}>
                        Erneut benachrichtigen beim Überschreiben
                    </label>
                </fieldset>

                ${this.#i?"":i`
                    <div class="scheduling-section">
                        <label>
                            <input type="checkbox" .checked=${this.#r}
                                   @change=${e=>{this.#r=e.target.checked,this.triggerViewUpdate()}}>
                            Verzögert senden
                        </label>
                    </div>
                `}

                ${this.#i||this.#r?i`
                    <label>Sendezeitpunkt
                        <input type="datetime-local" .value=${this.#l}
                               @input=${e=>{this.#l=e.target.value}}>
                    </label>
                `:""}

                <div style="display:flex; gap: calc(var(--spacing-unit)*0.5); margin-block-start: calc(var(--spacing-unit)*0.5)">
                    <button class="primary-button" @click=${e=>this.#m(e)}>
                        ${this.#i?"Speichern":this.#r?"Planen":"Nachricht senden"}
                    </button>
                    ${this.#i?i`
                        <button class="secondary-button" @click=${()=>n("/admin/scheduled")}>
                            Abbrechen
                        </button>
                    `:""}
                </div>
            </div>
        `}}customElements.define("b-broadcast-send",r);
