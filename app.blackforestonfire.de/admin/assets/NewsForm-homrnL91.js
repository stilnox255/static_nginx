import{B as r,a as i,s,n as l,b as a}from"./index-DM9i3pX3.js";class h extends r{#s=null;#t=!1;#e={titleDe:"",titleFr:"",titleEn:"",teaserDe:"",teaserFr:"",teaserEn:"",publishedAt:new Date().toISOString().slice(0,16),published:!1};async connectedCallback(){super.connectedCallback(),this.#s=this.location?.params?.id??null,this.#s&&await this.#a(),this.triggerViewUpdate()}async#a(){try{const e=(await(await i("/api/news?includeDrafts=true")).json()).find(n=>n.id===this.#s);if(!e)throw new Error;this.#e={titleDe:e.titleDe,titleFr:e.titleFr,titleEn:e.titleEn,teaserDe:e.teaserDe,teaserFr:e.teaserFr,teaserEn:e.teaserEn,publishedAt:e.publishedAt?.slice(0,16)??"",published:e.published}}catch{s("error","Fehler beim Laden.")}}async#l(){if(!(!this.#e.titleDe&&!this.#e.teaserDe)){this.#t=!0,this.triggerViewUpdate();try{const e=await(await i("/api/translations",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:this.#e.titleDe,body:this.#e.teaserDe})})).json();this.#e.titleFr=e.fr?.title??"",this.#e.teaserFr=e.fr?.body??"",this.#e.titleEn=e.en?.title??"",this.#e.teaserEn=e.en?.body??""}catch{}this.#t=!1,this.triggerViewUpdate()}}async#n(t){t.preventDefault();const e={...this.#e,publishedAt:new Date(this.#e.publishedAt).toISOString()};try{this.#s?(await i(`/api/news/${this.#s}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),s("success","News gespeichert.")):(await i("/api/news",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),s("success","News angelegt.")),l("/admin/news")}catch{s("error","Fehler beim Speichern.")}}#i(t){return e=>{this.#e[t]=e.target.value}}view(){const t=this.#e;return a`
            <div class="config-section">
                <h2>${this.#s?"News bearbeiten":"Neue News"}</h2>
                <form @submit=${e=>this.#n(e)}>
                    <div class="broadcast-languages">
                        <fieldset>
                            <legend>Deutsch</legend>
                            <label>Titel <input type="text" required .value=${t.titleDe} @input=${this.#i("titleDe")}></label>
                            <label>Teaser <input type="text" required .value=${t.teaserDe} @input=${this.#i("teaserDe")}></label>
                            <button type="button" class="secondary-button" ?disabled=${this.#t}
                                @click=${()=>this.#l()}>
                                ${this.#t?"Wird übersetzt…":"Übersetzen"}
                            </button>
                        </fieldset>
                        <fieldset ?disabled=${this.#t}>
                            <legend>Français ${this.#t?a`<small>(wird übersetzt…)</small>`:""}</legend>
                            <label>Titre <input type="text" .value=${t.titleFr} @input=${this.#i("titleFr")}></label>
                            <label>Teaser <input type="text" .value=${t.teaserFr} @input=${this.#i("teaserFr")}></label>
                        </fieldset>
                        <fieldset ?disabled=${this.#t}>
                            <legend>English ${this.#t?a`<small>(translating…)</small>`:""}</legend>
                            <label>Title <input type="text" .value=${t.titleEn} @input=${this.#i("titleEn")}></label>
                            <label>Teaser <input type="text" .value=${t.teaserEn} @input=${this.#i("teaserEn")}></label>
                        </fieldset>
                    </div>

                    <fieldset>
                        <legend>Veröffentlichung</legend>
                        <label>Datum <input type="datetime-local" .value=${t.publishedAt} @input=${this.#i("publishedAt")}></label>
                        <label>
                            <input type="checkbox" .checked=${t.published}
                                @change=${e=>{this.#e.published=e.target.checked,this.triggerViewUpdate()}}>
                            Veröffentlicht
                        </label>
                    </fieldset>

                    <div class="form-actions">
                        <button type="submit" class="primary-button">Speichern</button>
                        <button type="button" class="secondary-button" @click=${()=>l("/admin/news")}>Abbrechen</button>
                    </div>
                </form>
            </div>
        `}}customElements.define("b-news-form",h);
